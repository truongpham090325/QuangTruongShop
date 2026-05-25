import axios from "axios";
import { Request, Response } from "express";
import FormData from "form-data";
import Media from "../../models/media.model";
import moment from "moment";
import { formatFileSize } from "../../helpers/format.helper";
import { domainCDN } from "../../configs/variable.config";

export const fileManager = async (req: Request, res: Response) => {
  // Danh sách các file
  const find: {
    folder?: string;
  } = {};

  find.folder = "/media";
  if (req.query.folderPath) {
    find.folder = find.folder + `/${req.query.folderPath}`;
  }

  // Phân trang
  let page = 1;
  const limitItems = 10;
  if (req.query.page && parseInt(`${req.query.page}`) > 0) {
    page = parseInt(`${req.query.page}`);
  }
  const totalRecord = await Media.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);
  const skip = (page - 1) * limitItems;
  const pagination = {
    totalRecord: totalRecord,
    totalPage: totalPage,
    skip: skip,
  };
  // Hết Phân trang

  const listFile: any = await Media.find(find)
    .sort({
      createdAt: "desc",
    })
    .limit(limitItems)
    .skip(skip);

  for (const item of listFile) {
    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.sizeFormat = formatFileSize(item.size);
  }
  // Hết danh sách các file

  // Danh sách folder
  let folderList = [];
  const response = await axios.get(
    `${domainCDN}/file-manager/folder/list?folderPath=${req.query.folderPath}`,
    {
      headers: {
        Authorization: `Bearer ${process.env.FILE_MANAGER_SECRET}`,
      },
    },
  );

  if (response.data.code == "success") {
    folderList = response.data.forderList;
    for (const item of folderList) {
      item.createdAtFormat = moment(item.createdAt).format(
        "HH:mm - DD/MM/YYYY",
      );
    }
  }
  // Hết Danh sách folder

  res.render("admin/pages/file-manager", {
    pageTitle: "Quản lý file",
    listFile: listFile,
    pagination: pagination,
    folderList: folderList,
  });
};

export const uploadPost = async (req: Request, res: Response) => {
  try {
    const files = req.files as Express.Multer.File[];

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("files", file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
      });
    });

    if (req.query.folderPath) {
      formData.append("folderPath", req.query.folderPath);
    }

    const response = await axios.post(
      `${domainCDN}/file-manager/upload`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.FILE_MANAGER_SECRET}`,
        },
      },
    );

    if (response.data.code == "success") {
      await Media.insertMany(response.data.saveLinks);
      res.json({
        code: "success",
        message: "Upload thành công!",
      });
    } else {
      res.status(400).json({
        code: "error",
        message: "Upload thất bại!",
      });
    }
  } catch (error) {
    console.log(error);
    res.status(400).json({
      code: "error",
      message: "Upload thất bại!",
    });
  }
};

export const changeFileNamePatch = async (req: Request, res: Response) => {
  try {
    const { fileId, fileName } = req.body;

    if (!fileId || !fileName) {
      res.json({
        code: "error",
        message: "Thiếu thông tin cần thiết!",
      });
      return;
    }

    const record = await Media.findOne({
      _id: fileId,
    });

    if (!record) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("folder", record.folder);
    formData.append("oldFileName", record.fileName);
    formData.append("newFileName", fileName);

    const response = await axios.patch(
      `${domainCDN}/file-manager/change-file-name`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.FILE_MANAGER_SECRET}`,
        },
      },
    );

    if (response.data.code == "error") {
      res.json({
        code: "error",
        message: response.data.message,
      });
      return;
    }

    // Cập nhập lại trường fileName trong CSDL
    await Media.updateOne(
      {
        _id: fileId,
      },
      {
        fileName: fileName,
      },
    );

    res.json({
      code: "success",
      message: "Đã đổi tên file!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const deleteFileDel = async (req: Request, res: Response) => {
  try {
    const { fileId, fileName } = req.body;

    if (!fileId || !fileName) {
      res.json({
        code: "error",
        message: "Thiếu thông tin cần thiết!",
      });
      return;
    }

    const record = await Media.findOne({
      _id: fileId,
    });

    if (!record) {
      res.json({
        code: "error",
        message: "Bản ghi không tồn tại!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("folder", record.folder);
    formData.append("fileName", record.fileName);

    const response = await axios.patch(
      `${domainCDN}/file-manager/delete-file`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.FILE_MANAGER_SECRET}`,
        },
      },
    );

    if (response.data.code == "error") {
      res.json({
        code: "error",
        message: response.data.message,
      });
      return;
    }

    // Xóa bản ghi trong CSDL
    await Media.deleteOne({
      _id: fileId,
    });

    res.json({
      code: "success",
      message: "Đã xóa file!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const createFolderPost = async (req: Request, res: Response) => {
  try {
    const { folderName, folderPath } = req.body;

    if (!folderName) {
      res.json({
        code: "error",
        message: "Vui lòng nhập tên folder!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("folderName", folderName);

    if (folderPath) {
      formData.append("folderPath", folderPath);
    }

    const response = await axios.post(
      `${domainCDN}/file-manager/folder/create`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.FILE_MANAGER_SECRET}`,
        },
      },
    );

    if (response.data.code == "error") {
      res.json({
        code: "error",
        message: response.data.message,
      });
      return;
    }

    res.json({
      code: "success",
      message: "Đã tạo folder!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const deleteFolderDel = async (req: Request, res: Response) => {
  try {
    const folderPath = req.query.folderPath;

    if (!folderPath) {
      res.json({
        code: "error",
        message: "Vui lòng gửi kèm theo tên folder!",
      });
      return;
    }

    const formData = new FormData();
    formData.append("folderPath", folderPath);

    const response = await axios.patch(
      `${domainCDN}/file-manager/folder/delete`,
      formData,
      {
        headers: {
          ...formData.getHeaders(),
          Authorization: `Bearer ${process.env.FILE_MANAGER_SECRET}`,
        },
      },
    );

    if (response.data.code == "error") {
      res.json({
        code: "error",
        message: response.data.message,
      });
      return;
    }

    // Xóa các file liên quan trong CSDL
    const regexFolderPath = new RegExp(`${folderPath}`);
    await Media.deleteMany({
      folder: regexFolderPath,
    });

    res.json({
      code: "success",
      message: "Đã xóa folder!",
    });
  } catch (error) {
    console.log(error);
    res.json({
      code: "error",
      message: "Dữ liệu không hợp lệ!",
    });
  }
};

export const iframe = async (req: Request, res: Response) => {
  res.render("admin/pages/file-manager-iframe", {
    pageTitle: "Quản lý file",
  });
};
