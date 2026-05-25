// Khởi tạo TinyMCE
const initialTinyMCE = () => {
  tinymce.init({
    selector: "[textarea-mce]",
    plugins:
      "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
    toolbar:
      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
    init_instance_callback: (editor) => {
      editor.on("OpenWindow", () => {
        const title = document.querySelector(
          ".tox .tox-dialog__title",
        )?.innerHTML;
        if (title == "Insert/Edit Media" || title == "Insert/Edit Image") {
          const inputSource = document.querySelector(
            `.tox input.tox-textfield[type="url"]`,
          );
          inputSource.value = domainCDN;
        }
      });
    },
  });
};
initialTinyMCE();
// Hết Khởi tạo TinyMCE

// Khởi tạo thư viện Notyf
var notyf = new Notyf({
  duration: 3000,
  position: { x: "right", y: "top" },
  dismissible: true,
});

const notifyData = sessionStorage.getItem("notify");
if (notifyData) {
  const { type, message } = JSON.parse(notifyData);
  if (type == "success") {
    notyf.success(message);
  } else if (type == "error") {
    notyf.error(message);
  }
  sessionStorage.removeItem("notify");
}

const drawNotify = (type, message) => {
  sessionStorage.setItem(
    "notify",
    JSON.stringify({
      type: type,
      message: message,
    }),
  );
};

// blogCreateCategoryForm
const blogCreateCategoryForm = document.querySelector(
  "#blogCreateCategoryForm",
);
if (blogCreateCategoryForm) {
  const validation = new JustValidate("#blogCreateCategoryForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên danh mục bài viết!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const parent = event.target.parent.value;
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const description = tinymce.get("description").getContent();

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("parent", parent);
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("description", description);

      fetch(`/${pathAdmin}/blog/category/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End blogCreateCategoryForm

// blogEditCategoryForm
const blogEditCategoryForm = document.querySelector("#blogEditCategoryForm");
if (blogEditCategoryForm) {
  const validation = new JustValidate("#blogEditCategoryForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên danh mục bài viết!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const parent = event.target.parent.value;
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const description = tinymce.get("description").getContent();

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("parent", parent);
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("description", description);

      fetch(`/${pathAdmin}/blog/category/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End blogEditCategoryForm

// btn-generate-slug
const btnGenerateSlug = document.querySelector("[btn-generate-slug]");
if (btnGenerateSlug) {
  btnGenerateSlug.addEventListener("click", () => {
    const modelName = btnGenerateSlug.getAttribute("btn-generate-slug");
    const from = btnGenerateSlug.getAttribute("from");
    const to = btnGenerateSlug.getAttribute("to");
    const string = document.querySelector(`[name="${from}"]`).value;

    const dataFinal = {
      string: string,
      modelName: modelName,
    };

    fetch(`/${pathAdmin}/helper/generate-slug`, {
      method: "POST",
      headers: {
        "Content-type": "application/json",
      },
      body: JSON.stringify(dataFinal),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "error") {
          notyf.error(data.message);
        }

        if (data.code == "success") {
          document.querySelector(`[name="${to}"]`).value = data.slug;
        }
      });
  });
}
// End btn-generate-slug

// button-api
const listButtonApi = document.querySelectorAll("[button-api]");
if (listButtonApi.length > 0) {
  listButtonApi.forEach((button) => {
    button.addEventListener("click", () => {
      const method = button.getAttribute("data-method");
      const api = button.getAttribute("data-api");

      if (method == "DELETE") {
        Swal.fire({
          title: "Bạn có chắc muốn xóa không?",
          text: "Hành động không thể khôi phục!",
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "yellow",
          cancelButtonColor: "red",
          confirmButtonText: "Đồng ý!",
          cancelButtonText: "Hủy bỏ",
        }).then((result) => {
          if (result.isConfirmed) {
            fetch(api, {
              method: method,
            })
              .then((res) => res.json())
              .then((data) => {
                if (data.code == "error") {
                  notyf.error(data.message);
                }

                if (data.code == "success") {
                  drawNotify(data.code, data.message);
                  window.location.reload();
                }
              });
          }
        });
      } else {
        fetch(api, {
          method: method || "GET",
        })
          .then((res) => res.json())
          .then((data) => {
            if (data.code == "error") {
              notyf.error(data.message);
            }

            if (data.code == "success") {
              drawNotify(data.code, data.message);
              window.location.reload();
            }
          });
      }
    });
  });
}
// End button-api

// form-search
const formSearch = document.querySelector("[form-search]");
if (formSearch) {
  const url = new URL(window.location.href);

  formSearch.addEventListener("submit", (event) => {
    event.preventDefault();

    const value = event.target.keyword.value;
    if (value) {
      url.searchParams.set("keyword", value);
    } else {
      url.searchParams.delete("keyword");
    }
    window.location.href = url.href;
  });

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("keyword");
  if (valueCurrent) {
    formSearch.keyword.value = valueCurrent;
  }
}
// End form-search

// pagination
const pagination = document.querySelector("[pagination]");
if (pagination) {
  const url = new URL(window.location.href);
  pagination.addEventListener("change", () => {
    const value = pagination.value;
    if (value) {
      url.searchParams.set("page", value);
    } else {
      url.searchParams.delete("page");
    }
    window.location.href = url.href;
  });

  // Hiển thị giá trị mặc định
  const valueCurrent = url.searchParams.get("page");
  if (valueCurrent) {
    pagination.value = valueCurrent;
  }
}
// End pagination

// button-copy
const listButtonCopy = document.querySelectorAll("[button-copy]");
if (listButtonCopy.length > 0) {
  listButtonCopy.forEach((button) => {
    button.addEventListener("click", () => {
      const content = button.getAttribute("data-content");
      window.navigator.clipboard.writeText(content);
      notyf.success("Đã copy!");
    });
  });
}
// End button-copy

// modalPreviewFile
const modalPreviewFile = document.querySelector("#modalPreviewFile");
if (modalPreviewFile) {
  const innerPreview = modalPreviewFile.querySelector(".inner-preview");

  // Sự kiện đóng modal
  modalPreviewFile.addEventListener("hide.bs.modal", (event) => {
    innerPreview.innerHTML = "";
  });

  // Sự kiện mở modal
  modalPreviewFile.addEventListener("show.bs.modal", (event) => {
    const buttonClicked = event.relatedTarget;
    const file = buttonClicked.getAttribute("data-file");
    const mimetype = buttonClicked.getAttribute("data-mimetype");

    // Hiển thị file theo đúng định dạng
    if (mimetype.includes("image")) {
      innerPreview.innerHTML = `
        <img src="${file}" width="100%" />
      `;
    } else if (mimetype.includes("audio")) {
      innerPreview.innerHTML = `
        <audio controls width="100%">
          <source src="${file}"></source/>
        </audio>
      `;
    } else if (mimetype.includes("video")) {
      innerPreview.innerHTML = `
        <video controls width="100%">
          <source src="${file}"></source/>
        </video>
      `;
    } else if (mimetype.includes("application")) {
      innerPreview.innerHTML = `
        <iframe src=${file} width="100%" height="500px"></iframe>
      `;
    }
  });
}
// End modalPreviewFile

// modalChangeFile
const modalChangeFile = document.querySelector("#modalChangeFile");
if (modalChangeFile) {
  // Sự kiện đóng modal
  modalChangeFile.addEventListener("hide.bs.modal", (event) => {
    const form = modalChangeFile.querySelector("form");
    form.reset();
  });

  // Sự kiện mở modal
  modalChangeFile.addEventListener("show.bs.modal", (event) => {
    const buttonClicked = event.relatedTarget;
    const fileName = buttonClicked.getAttribute("data-file-name");
    const fileId = buttonClicked.getAttribute("data-file-id");

    const form = modalChangeFile.querySelector("form");
    form.fileName.value = fileName;
    form.fileId.value = fileId;
  });

  // Sự kiện submit form
  const form = modalChangeFile.querySelector("form");
  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const fileId = event.target.fileId.value;
    const fileName = event.target.fileName.value;

    if (!fileId || !fileName) {
      notyf.error("Vui lòng nhập tên file!");
      return;
    }

    const dataFinal = {
      fileId: fileId,
      fileName: fileName,
    };

    fetch(`/${pathAdmin}/file-manager/change-file-name`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataFinal),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "error") {
          notyf.error(data.message);
        } else {
          drawNotify(data.code, data.message);
          window.location.reload();
        }
      });
  });
}
// End modalChangeFile

// button-delete-file
const listButtonDeleteFile = document.querySelectorAll("[button-delete-file]");
if (listButtonDeleteFile.length > 0) {
  listButtonDeleteFile.forEach((button) => {
    button.addEventListener("click", () => {
      Swal.fire({
        title: "Bạn có chắc muốn xóa không?",
        text: "Hành động không thể khôi phục!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "yellow",
        cancelButtonColor: "red",
        confirmButtonText: "Đồng ý!",
        cancelButtonText: "Hủy bỏ",
      }).then((result) => {
        if (result.isConfirmed) {
          const fileId = button.getAttribute("data-file-id");
          const fileName = button.getAttribute("data-file-name");

          const dataFinal = {
            fileId: fileId,
            fileName: fileName,
          };

          fetch(`/${pathAdmin}/file-manager/delete-file`, {
            method: "DELETE",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(dataFinal),
          })
            .then((res) => res.json())
            .then((data) => {
              if (data.code == "error") {
                notyf.error(data.message);
              } else {
                drawNotify(data.code, data.message);
                window.location.reload();
              }
            });
        }
      });
    });
  });
}
// End button-delete-file

// form-create-folder
const formCreateFolder = document.querySelector("[form-create-folder]");
if (formCreateFolder) {
  formCreateFolder.addEventListener("submit", (event) => {
    event.preventDefault();

    const folderName = event.target.folderName.value;
    if (!folderName) {
      notyf.error("Vui lòng nhập tên folder!");
      return;
    }

    const dataFinal = {
      folderName: folderName,
    };

    const urlParams = new URLSearchParams(window.location.search);
    const folderPath = urlParams.get("folderPath");
    if (folderPath) {
      dataFinal.folderPath = folderPath;
    }

    fetch(`/${pathAdmin}/file-manager/folder/create`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(dataFinal),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data.code == "error") {
          notyf.error(data.message);
        } else {
          drawNotify(data.code, data.message);
          window.location.reload();
        }
      });
  });
}
// End form-create-folder

// button-to-folder
const listButtonToFolder = document.querySelectorAll("[button-to-folder]");
if (listButtonToFolder.length > 0) {
  const url = new URL(window.location.href);

  listButtonToFolder.forEach((button) => {
    button.addEventListener("click", () => {
      let folderPath = button.getAttribute("data-folder-path");

      if (folderPath) {
        const urlParams = new URLSearchParams(window.location.search);
        const folderPathCurrent = urlParams.get("folderPath");
        if (folderPathCurrent) {
          folderPath = `${folderPathCurrent}/${folderPath}`;
        }
        url.searchParams.set("folderPath", folderPath);
      } else {
        url.searchParams.delete("folderPath");
      }
      window.location.href = url.href;
    });
  });
}
// End button-to-folder

// breadcumb-folder
const breadcumbFolder = document.querySelector("[breadcumb-folder]");
if (breadcumbFolder) {
  const urlParams = new URLSearchParams(window.location.search);
  const folderPath = urlParams.get("folderPath") || "";
  const listFolder = folderPath.split("/") || [];

  let htmls = `
    <li class="list-group-item bg-white">
      <a href="/${pathAdmin}/file-manager">
        <i class="la la-angle-double-right text-info me-2"></i>
        Media
      </a>
    </li>
  `;

  let path = "";
  listFolder.forEach((item, index) => {
    path += (index > 0 ? "/" : "") + listFolder[index];

    htmls += `
    <li class="list-group-item bg-white">
      <a href="/${pathAdmin}/file-manager?folderPath=${path}">
        <i class="la la-angle-double-right text-info me-2"></i>
        ${item}
      </a>
    </li>
    `;
  });
  breadcumbFolder.innerHTML = htmls;
}
// End breadcumb-folder

// button-delete-folder
const listButtonDeleteFolder = document.querySelectorAll(
  "[button-delete-folder]",
);
if (listButtonDeleteFolder.length > 0) {
  listButtonDeleteFolder.forEach((button) => {
    button.addEventListener("click", () => {
      const folderName = button.getAttribute("data-folder-name");

      const urlParams = new URLSearchParams(window.location.search) || "";
      const folderPath = urlParams.get("folderPath") || "";
      let folderFinal = "/media";
      if (folderPath) {
        folderFinal += `/${folderPath}`;
      }
      if (folderName) {
        folderFinal += `/${folderName}`;
      }

      Swal.fire({
        title: "Bạn có chắc muốn xóa không?",
        text: "Hành động không thể khôi phục!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "yellow",
        cancelButtonColor: "red",
        confirmButtonText: "Đồng ý!",
        cancelButtonText: "Hủy bỏ",
      }).then((result) => {
        if (result.isConfirmed) {
          fetch(
            `/${pathAdmin}/file-manager/folder/delete?folderPath=${folderFinal}`,
            {
              method: "DELETE",
            },
          )
            .then((res) => res.json())
            .then((data) => {
              if (data.code == "error") {
                notyf.error(data.message);
              }

              if (data.code == "success") {
                drawNotify(data.code, data.message);
                window.location.reload();
              }
            });
        }
      });
    });
  });
}
// End button-delete-folder

// form-group-file
const formGroupFile = document.querySelector("[form-group-file]");
if (formGroupFile) {
  const inputFile = formGroupFile.querySelector("[input-file]");
  inputFile.addEventListener("input", () => {
    const value = inputFile.value;
    const previewFile = formGroupFile.querySelector("[preview-file]");
    const img = previewFile.querySelector("img");
    img.src = `${domainCDN}${value}`;
  });

  // Hiện thị mặc định
  if (inputFile.value) {
    const value = inputFile.value;
    const previewFile = formGroupFile.querySelector("[preview-file]");
    const img = previewFile.querySelector("img");
    img.src = `${domainCDN}${value}`;
  }
}
// End form-group-file

// checkbox-list
const getCheckBoxList = (name) => {
  const checkboxList = document.querySelector(`[checkbox-list="${name}"]`);
  const inputList = checkboxList.querySelectorAll(
    `input[type="checkbox"]:checked`,
  );
  const idList = [];
  inputList.forEach((input) => {
    const id = input.value;
    if (id) {
      idList.push(id);
    }
  });
  return idList;
};
// End checkbox-list

// getMultiFile
const getMultiFile = (name) => {
  const boxMultiFile = document.querySelector(`[multi-file=${name}]`);
  const listLink = [];
  const listImage = boxMultiFile.querySelectorAll(
    ".inner-image img[src-relative]",
  );
  listImage.forEach((image) => {
    const link = image.getAttribute("src-relative");
    if (link) {
      listLink.push(link);
    }
  });
  return listLink;
};
// End getMultiFile

// getOptionlist
const getOptionlist = (name) => {
  const optionList = document.querySelectorAll(
    `[box-option="${name}"] .option-list .option-item`,
  );

  const dataFinal = [];
  optionList.forEach((option) => {
    const label = option.querySelector(".option-label").value;
    const value = option.querySelector(".option-value").value;
    if (label && value) {
      dataFinal.push({
        label: label,
        value: value,
      });
    }
  });
  return dataFinal;
};
// End getOptionlist

// blogCreateForm
const blogCreateForm = document.querySelector("#blogCreateForm");
if (blogCreateForm) {
  const validation = new JustValidate("#blogCreateForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên bài viết!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const category = getCheckBoxList("category");
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const description = tinymce.get("description").getContent();
      const content = tinymce.get("content").getContent();

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("category", JSON.stringify(category));
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("description", description);
      formData.append("content", content);
      console.log(formData);

      fetch(`/${pathAdmin}/blog/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End blogCreateForm

// blogEditForm
const blogEditForm = document.querySelector("#blogEditForm");
if (blogEditForm) {
  const validation = new JustValidate("#blogEditForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên bài viết!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const category = getCheckBoxList("category");
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const description = tinymce.get("description").getContent();
      const content = tinymce.get("content").getContent();

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("category", JSON.stringify(category));
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("description", description);
      formData.append("content", content);
      console.log(formData);

      fetch(`/${pathAdmin}/blog/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End blogEditForm

// roleCreateForm
const roleCreateForm = document.querySelector("#roleCreateForm");
if (roleCreateForm) {
  const validation = new JustValidate("#roleCreateForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên nhóm quyền!",
      },
    ])
    .onSuccess((event) => {
      const name = event.target.name.value;
      const description = event.target.description.value;
      const permissions = getCheckBoxList("permissions");
      const status = event.target.status.value;

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("permissions", JSON.stringify(permissions));
      formData.append("status", status);

      fetch(`/${pathAdmin}/role/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End roleCreateForm

// roleEditForm
const roleEditForm = document.querySelector("#roleEditForm");
if (roleEditForm) {
  const validation = new JustValidate("#roleEditForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên nhóm quyền!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const name = event.target.name.value;
      const description = event.target.description.value;
      const permissions = getCheckBoxList("permissions");
      const status = event.target.status.value;

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("description", description);
      formData.append("permissions", JSON.stringify(permissions));
      formData.append("status", status);

      fetch(`/${pathAdmin}/role/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End roleEditForm

// accountAdminCreateForm
const accountAdminCreateForm = document.querySelector(
  "#accountAdminCreateForm",
);
if (accountAdminCreateForm) {
  const validation = new JustValidate("#accountAdminCreateForm");

  validation
    .addField("#fullName", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập họ tên!",
      },
      {
        rule: "minLength",
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự!",
      },
      {
        rule: "maxLength",
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự!",
      },
    ])
    .addField("#email", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập email của bạn!",
      },
      {
        rule: "email",
        errorMessage: "Email không đúng định dạng!",
      },
    ])
    .addField("#password", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mật khẩu!",
      },
      {
        validator: (value) => value.length >= 8,
        errorMessage: "Mật khẩu phải chứa ít nhất 8 ký tự!",
      },
      {
        validator: (value) => /[A-Z]/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái in hoa!",
      },
      {
        validator: (value) => /[a-z]/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái thường!",
      },
      {
        validator: (value) => /\d/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ số!",
      },
      {
        validator: (value) => /[@$!%*?&]/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt!",
      },
    ])
    .onSuccess((event) => {
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const password = event.target.password.value;
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const roles = getCheckBoxList("roles");

      // Tạo FormData
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("password", password);
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("roles", JSON.stringify(roles));

      fetch(`/${pathAdmin}/account-admin/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End accountAdminCreateForm

// accountAdminEditForm
const accountAdminEditForm = document.querySelector("#accountAdminEditForm");
if (accountAdminEditForm) {
  const validation = new JustValidate("#accountAdminEditForm");

  validation
    .addField("#fullName", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập họ tên!",
      },
      {
        rule: "minLength",
        value: 5,
        errorMessage: "Họ tên phải có ít nhất 5 ký tự!",
      },
      {
        rule: "maxLength",
        value: 50,
        errorMessage: "Họ tên không được vượt quá 50 ký tự!",
      },
    ])
    .addField("#email", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập email của bạn!",
      },
      {
        rule: "email",
        errorMessage: "Email không đúng định dạng!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const fullName = event.target.fullName.value;
      const email = event.target.email.value;
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const roles = getCheckBoxList("roles");

      // Tạo FormData
      const formData = new FormData();
      formData.append("fullName", fullName);
      formData.append("email", email);
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("roles", JSON.stringify(roles));

      fetch(`/${pathAdmin}/account-admin/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End accountAdminEditForm

// accountAdminChangePasswordForm
const accountAdminChangePasswordForm = document.querySelector(
  "#accountAdminChangePasswordForm",
);
if (accountAdminChangePasswordForm) {
  const validation = new JustValidate("#accountAdminChangePasswordForm");

  validation
    .addField("#password", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mật khẩu!",
      },
      {
        validator: (value) => value.length >= 8,
        errorMessage: "Mật khẩu phải chứa ít nhất 8 ký tự!",
      },
      {
        validator: (value) => /[A-Z]/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái in hoa!",
      },
      {
        validator: (value) => /[a-z]/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ cái thường!",
      },
      {
        validator: (value) => /\d/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một chữ số!",
      },
      {
        validator: (value) => /[@$!%*?&]/.test(value),
        errorMessage: "Mật khẩu phải chứa ít nhất một ký tự đặc biệt!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const password = event.target.password.value;

      // Tạo FormData
      const formData = new FormData();
      formData.append("password", password);

      fetch(`/${pathAdmin}/account-admin/change-password/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End accountAdminChangePasswordForm

// accountLoginForm
const accountLoginForm = document.querySelector("#accountLoginForm");
if (accountLoginForm) {
  const validation = new JustValidate("#accountLoginForm");

  validation
    .addField("#email", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập email của bạn!",
      },
      {
        rule: "email",
        errorMessage: "Email không đúng định dạng!",
      },
    ])
    .addField("#password", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mật khẩu!",
      },
    ])
    .onSuccess((event) => {
      const email = event.target.email.value;
      const password = event.target.password.value;
      const rememberPassword = event.target.rememberPassword.checked;

      const dataFinal = {
        email: email,
        password: password,
        rememberPassword: rememberPassword,
      };

      fetch(`/${pathAdmin}/account/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(dataFinal),
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.href = `/${pathAdmin}/dashboard`;
          }
        });
    });
}
// End accountLoginForm

// productCreateCategoryForm
const productCreateCategoryForm = document.querySelector(
  "#productCreateCategoryForm",
);
if (productCreateCategoryForm) {
  const validation = new JustValidate("#productCreateCategoryForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên danh mục sản phẩm!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const parent = event.target.parent.value;
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const description = tinymce.get("description").getContent();

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("parent", parent);
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("description", description);

      fetch(`/${pathAdmin}/product/category/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End productCreateCategoryForm

// productEditCategoryForm
const productEditCategoryForm = document.querySelector(
  "#productEditCategoryForm",
);
if (productEditCategoryForm) {
  const validation = new JustValidate("#productEditCategoryForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên danh mục bài viết!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const parent = event.target.parent.value;
      const status = event.target.status.value;
      const avatar = event.target.avatar.value;
      const description = tinymce.get("description").getContent();

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("parent", parent);
      formData.append("status", status);
      formData.append("avatar", avatar);
      formData.append("description", description);

      fetch(`/${pathAdmin}/product/category/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End productEditCategoryForm

// productCreateForm
const productCreateForm = document.querySelector("#productCreateForm");
if (productCreateForm) {
  const validation = new JustValidate("#productCreateForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên sản phẩm!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const position = event.target.position.value;
      const status = event.target.status.value;
      const category = getCheckBoxList("category");
      const priceOld = event.target.priceOld.value;
      const priceNew = event.target.priceNew.value;
      const stock = event.target.stock.value;
      const description = tinymce.get("description").getContent();
      const content = tinymce.get("content").getContent();
      const images = getMultiFile("images");
      const attributes = getCheckBoxList("attributes");

      // variants
      const variants = [];
      const listTr = document.querySelectorAll("[variant-table] tbody tr");
      listTr.forEach((tr) => {
        const status = tr.querySelector("input.form-check-input").checked;
        const attributeValue = JSON.parse(
          tr.querySelector("[attribute-value]").value,
        );
        let priceOld = tr.querySelector("[price-old]").value;
        if (priceOld) {
          priceOld = parseInt(priceOld);
        }
        let priceNew = tr.querySelector("[price-new]").value;
        if (priceNew) {
          priceNew = parseInt(priceNew);
        } else {
          priceNew = priceOld;
        }
        let stock = tr.querySelector("[stock]").value;
        if (stock) {
          stock = parseInt(stock);
        } else {
          stock = 0;
        }
        variants.push({
          status: status,
          attributeValue: attributeValue,
          priceOld: priceOld,
          priceNew: priceNew,
          stock: stock,
        });
      });
      // End variants

      // tags
      const selectTag = document.querySelector(`select[name="tags"]`);
      const tags = Array.from(selectTag.selectedOptions).map((option) => {
        return option.value;
      });
      // End tags

      // boughtTogether
      const selectBoughtTogether = document.querySelector(
        `select[name="bought-together"]`,
      );
      const boughtTogether = Array.from(
        selectBoughtTogether.selectedOptions,
      ).map((option) => {
        return option.value;
      });
      // End boughtTogether

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("position", position);
      formData.append("status", status);
      formData.append("category", JSON.stringify(category));
      formData.append("priceOld", priceOld);
      formData.append("priceNew", priceNew);
      formData.append("stock", stock);
      formData.append("description", description);
      formData.append("content", content);
      formData.append("images", JSON.stringify(images));
      formData.append("attributes", JSON.stringify(attributes));
      formData.append("variants", JSON.stringify(variants));
      formData.append("tags", JSON.stringify(tags));
      formData.append("boughtTogether", JSON.stringify(boughtTogether));

      fetch(`/${pathAdmin}/product/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End productCreateForm

// Checkbox-all
const checkboxAll = document.querySelector(".checkbox-all");
if (checkboxAll) {
  const listCheckboxInput = document.querySelectorAll(".checkbox-input");

  checkboxAll.addEventListener("change", () => {
    const checked = checkboxAll.checked;
    listCheckboxInput.forEach((input) => {
      input.checked = checked;
    });
  });

  listCheckboxInput.forEach((input) => {
    input.addEventListener("change", () => {
      const listCheckboxInputChecked = document.querySelectorAll(
        ".checkbox-input:checked",
      );

      if (listCheckboxInputChecked.length == listCheckboxInput.length) {
        checkboxAll.checked = true;
      } else {
        checkboxAll.checked = false;
      }
    });
  });
}
// End Checkbox-all

// button-copy-multi
const buttonCopyMulti = document.querySelector("[button-copy-multi]");
if (buttonCopyMulti) {
  buttonCopyMulti.addEventListener("click", () => {
    const listCheckboxInputChecked = document.querySelectorAll(
      ".checkbox-input:checked",
    );
    const listLink = [];

    listCheckboxInputChecked.forEach((input) => {
      listLink.push(input.value);
    });
    if (listLink.length < 2) {
      window.navigator.clipboard.writeText(listLink);
      notyf.success("Đã copy!");
    } else {
      window.navigator.clipboard.writeText(JSON.stringify(listLink));
      notyf.success("Đã copy!");
    }
  });
}
// End button-copy-multi

// button-paste
const listButtonPaste = document.querySelectorAll("[button-paste]");
if (listButtonPaste.length > 0) {
  listButtonPaste.forEach((buttonPaste) => {
    const elementListImage = buttonPaste
      .closest(".form-multi-file")
      .querySelector(".inner-list-image");

    buttonPaste.addEventListener("click", async () => {
      const listLinkJson = await window.navigator.clipboard.readText();
      const listLink = JSON.parse(listLinkJson);

      let htmls = "";

      listLink.forEach((link) => {
        htmls += `
        <div class="inner-image" bis_skin_checked="1">
          <img src="${domainCDN}${link}" alt="" src-relative="${link}">
          <span class="inner-remove">x</span>
        </div>
      `;
      });

      elementListImage.innerHTML = htmls;

      new Sortable(elementListImage, {
        animation: 150,
      });
    });
  });
}
// End button-paste

// Button remove image
const listElementListImage = document.querySelectorAll(".inner-list-image");
if (listElementListImage.length > 0) {
  listElementListImage.forEach((elementListImage) => {
    elementListImage.addEventListener("click", (event) => {
      if (event.target.closest(".inner-remove")) {
        const itemParent = event.target.closest(".inner-image");
        if (itemParent) {
          itemParent.remove();
        }
      }
    });
  });
}
// End Button remove image

// Box option
const boxOption = document.querySelector("[box-option]");
if (boxOption) {
  const optionList = boxOption.querySelector(".option-list");
  const optionCreate = boxOption.querySelector(".option-create");

  // Tạo option
  optionCreate.addEventListener("click", () => {
    const newItem = `
      <div class="option-item" bis_skin_checked="1">
        <span class="btn btn-secondary option-move">
          <i class="fa-solid fa-up-down-left-right"></i>
        </span>
        <input class="form-control option-label" type="text" placeholder="Nhãn">
        <input class="form-control option-value" type="text" placeholder="Giá trị">
        <span class="btn btn-danger option-remove">Xóa</span>
      </div>
    `;
    optionList.insertAdjacentHTML("beforeend", newItem);
  });

  // Xóa option
  optionList.addEventListener("click", (event) => {
    if (event.target.closest(".option-remove")) {
      const itemParent = event.target.closest(".option-item");
      if (itemParent) {
        itemParent.remove();
      }
    }
  });

  // Sắp xếp
  new Sortable(optionList, {
    animation: 150,
    handle: ".option-move",
  });
}
// End Box option

// productCreateAttributeForm
const productCreateAttributeForm = document.querySelector(
  "#productCreateAttributeForm",
);
if (productCreateAttributeForm) {
  const validation = new JustValidate("#productCreateAttributeForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên thuộc tính!",
      },
    ])
    .onSuccess((event) => {
      const name = event.target.name.value;
      const type = event.target.type.value;
      const options = getOptionlist("options");

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", type);
      formData.append("options", JSON.stringify(options));

      fetch(`/${pathAdmin}/product/attribute/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify(data.code, data.message);
            window.location.reload();
          }
        });
    });
}
// End productCreateAttributeForm

// productEditAttributeForm
const productEditAttributeForm = document.querySelector(
  "#productEditAttributeForm",
);
if (productEditAttributeForm) {
  const validation = new JustValidate("#productEditAttributeForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên thuộc tính!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const name = event.target.name.value;
      const type = event.target.type.value;
      const options = getOptionlist("options");

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("type", type);
      formData.append("options", JSON.stringify(options));

      fetch(`/${pathAdmin}/product/attribute/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End productEditAttributeForm

// button-render-variant
const generateVariants = (attributes) => {
  // Bước 1: Lấy ra danh sách các lựa chọn (options) cho từng thuộc tính
  const optionList = attributes.map((attribute) => {
    return attribute.options.map((option) => {
      return {
        attrId: attribute._id,
        attrType: attribute.type,
        label: option.label,
        value: option.value,
      };
    });
  });

  // Bước 2: Tạo ra tổ hợp các biến thể
  const variantList = optionList.reduce(
    (a, b) => a.flatMap((x) => b.map((y) => [...x, y])),
    [[]],
  );

  return variantList;
};

const buttonRenderVariant = document.querySelector("[button-render-variant]");
if (buttonRenderVariant) {
  buttonRenderVariant.addEventListener("click", () => {
    const attr = buttonRenderVariant.getAttribute("button-render-variant");
    const idList = getCheckBoxList(attr);
    const attributeListChecked = attributeList.filter((item) =>
      idList.includes(item._id),
    );
    const variantList = generateVariants(attributeListChecked);

    // Lấy ra bảng
    const variantTable = document.querySelector("[variant-table]");

    // Hiển thị tiêu đề cột
    const variantHead = variantTable.querySelector("thead tr");
    let variantHeadHTML = `
      <th scope="col">Trạng thái</th>
    `;
    attributeListChecked.forEach((item) => {
      variantHeadHTML += `
        <th scope="col">${item.name}</th>
      `;
    });
    variantHeadHTML += `
      <th scope="col">Giá cũ</th>
      <th scope="col">Giá mới</th>
      <th scope="col">Còn lại</th>
    `;
    variantHead.innerHTML = variantHeadHTML;

    // Hiển thị các hàng
    const variantBody = variantTable.querySelector("tbody");
    const priceOld = document.querySelector(`[name="priceOld"]`).value;
    const priceNew = document.querySelector(`[name="priceNew"]`).value;

    let variantBodyHTML = "";
    variantList.forEach((variant) => {
      const variantJSON = JSON.stringify(variant).replaceAll(`"`, `&quot;`);
      let tr = `<tr>`;
      tr += `
        <td>
          <div class="form-check form-switch form-switch-success" bis_skin_checked="1">
            <input class="form-check-input" type="checkbox" checked="">
          </div>
          <input class="d-none" attribute-value value="${variantJSON}" />
        </td>
      `;
      variant.forEach((item) => {
        tr += `
          <td>${item.label}</td>
        `;
      });
      tr += `
        <td>
          <input class="form-control" type="number" value="${priceOld}" price-old>
        </td>
        <td>
          <input class="form-control" type="number" value="${priceNew}" price-new>
        </td>
        <td>
          <input class="form-control" type="number" value=0 stock>
        </td>
      `;
      tr += `</tr>`;
      variantBodyHTML += tr;
      variantBody.innerHTML = variantBodyHTML;
    });
  });
}
// End button-render-variant

// select-tag
const listSelectTag = document.querySelectorAll("[select-tag]");
if (listSelectTag.length > 0) {
  listSelectTag.forEach((selectTag) => {
    const taggable = selectTag.getAttribute("taggable");

    new Selectr(selectTag, {
      taggable: taggable == "false" ? false : true,
    });

    // Ngăn chặn sự kiện submit form
    const inputTag = document.querySelector(".selectr-tag-input");
    if (inputTag) {
      inputTag.addEventListener("keydown", (event) => {
        if (event.key == "Enter") {
          event.preventDefault();
        }
      });
    }
  });
}
// End select-tag

// productEditForm
const productEditForm = document.querySelector("#productEditForm");
if (productEditForm) {
  const validation = new JustValidate("#productEditForm");

  validation
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên sản phẩm!",
      },
    ])
    .addField("#slug", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên đường dẫn!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const name = event.target.name.value;
      const slug = event.target.slug.value;
      const position = event.target.position.value;
      const status = event.target.status.value;
      const category = getCheckBoxList("category");
      const priceOld = event.target.priceOld.value;
      const priceNew = event.target.priceNew.value;
      const stock = event.target.stock.value;
      const description = tinymce.get("description").getContent();
      const content = tinymce.get("content").getContent();
      const images = getMultiFile("images");
      const attributes = getCheckBoxList("attributes");

      // variants
      const variants = [];
      const listTr = document.querySelectorAll("[variant-table] tbody tr");
      listTr.forEach((tr) => {
        const status = tr.querySelector("input.form-check-input").checked;
        const attributeValue = JSON.parse(
          tr.querySelector("[attribute-value]").value,
        );
        let priceOld = tr.querySelector("[price-old]").value;
        if (priceOld) {
          priceOld = parseInt(priceOld);
        }
        let priceNew = tr.querySelector("[price-new]").value;
        if (priceNew) {
          priceNew = parseInt(priceNew);
        } else {
          priceNew = priceOld;
        }
        let stock = tr.querySelector("[stock]").value;
        if (stock) {
          stock = parseInt(stock);
        } else {
          stock = 0;
        }
        variants.push({
          status: status,
          attributeValue: attributeValue,
          priceOld: priceOld,
          priceNew: priceNew,
          stock: stock,
        });
      });
      // End variants

      // tags
      const selectTag = document.querySelector(`select[name="tags"]`);
      const tags = Array.from(selectTag.selectedOptions).map((option) => {
        return option.value;
      });
      // End tags

      // boughtTogether
      const selectBoughtTogether = document.querySelector(
        `select[name="bought-together"]`,
      );
      const boughtTogether = Array.from(
        selectBoughtTogether.selectedOptions,
      ).map((option) => {
        return option.value;
      });
      // End boughtTogether

      // Tạo formData
      const formData = new FormData();
      formData.append("name", name);
      formData.append("slug", slug);
      formData.append("position", position);
      formData.append("status", status);
      formData.append("category", JSON.stringify(category));
      formData.append("priceOld", priceOld);
      formData.append("priceNew", priceNew);
      formData.append("stock", stock);
      formData.append("description", description);
      formData.append("content", content);
      formData.append("images", JSON.stringify(images));
      formData.append("attributes", JSON.stringify(attributes));
      formData.append("variants", JSON.stringify(variants));
      formData.append("tags", JSON.stringify(tags));
      formData.append("boughtTogether", JSON.stringify(boughtTogether));

      fetch(`/${pathAdmin}/product/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End productEditForm

// formImportExcel
const formImportExcel = document.querySelector("#formImportExcel");
if (formImportExcel) {
  const validation = new JustValidate("#formImportExcel");

  validation
    .addField("#file", [
      {
        rule: "minFilesCount",
        value: 1,
        errorMessage: "Vui lòng chọn file CSV",
      },
      {
        rule: "files",
        value: {
          files: {
            extensions: ["csv"],
            types: ["text/csv"],
          },
        },
        errorMessage: "Vui lòng chọn đúng loại file CSV",
      },
    ])
    .onSuccess((event) => {
      const fileInput = event.target.querySelector("#file");
      const file = fileInput.files[0]; // chỉ lấy 1 file đầu tiên
      const api = formImportExcel.getAttribute("data-api");

      // Tạo FormData
      const formData = new FormData();
      formData.append("file", file);

      fetch(api, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify("success", data.message);
            location.reload();
          }
        });
    });
}
// End formImportExcel

// date-range
const dateRange = document.querySelector("[date-range]");
if (dateRange) {
  new DateRangePicker(dateRange, {
    format: "dd/mm/yyyy",
  });
}
// End date-range

// couponCreateForm
const couponCreateForm = document.querySelector("#couponCreateForm");
if (couponCreateForm) {
  const validation = new JustValidate("#couponCreateForm");

  validation
    .addField("#code", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mã giảm giá!",
      },
    ])
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên mã giảm giá!",
      },
    ])
    .onSuccess((event) => {
      const code = event.target.code.value;
      const name = event.target.name.value;
      const typeDiscount = event.target.typeDiscount.value;
      const value = event.target.value.value;
      const minOrderValue = event.target.minOrderValue.value;
      const maxDiscountValue = event.target.maxDiscountValue.value;
      const usageLimit = event.target.usageLimit.value;
      const typeDisplay = event.target.typeDisplay.value;
      const status = event.target.status.value;
      const startDate = event.target.startDate.value;
      const endDate = event.target.endDate.value;
      const description = tinymce.get("description").getContent();

      // Tạo FormData
      const formData = new FormData();
      formData.append("code", code);
      formData.append("name", name);
      formData.append("typeDiscount", typeDiscount);
      formData.append("value", value);
      formData.append("minOrderValue", minOrderValue);
      formData.append("maxDiscountValue", maxDiscountValue);
      formData.append("usageLimit", usageLimit);
      formData.append("typeDisplay", typeDisplay);
      formData.append("status", status);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("description", description);

      fetch(`/${pathAdmin}/coupon/create`, {
        method: "POST",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            drawNotify("success", data.message);
            location.reload();
          }
        });
    });
}
// End couponCreateForm

// couponEditForm
const couponEditForm = document.querySelector("#couponEditForm");
if (couponEditForm) {
  const validation = new JustValidate("#couponEditForm");

  validation
    .addField("#code", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập mã giảm giá!",
      },
    ])
    .addField("#name", [
      {
        rule: "required",
        errorMessage: "Vui lòng nhập tên mã giảm giá!",
      },
    ])
    .onSuccess((event) => {
      const id = event.target.id.value;
      const code = event.target.code.value;
      const name = event.target.name.value;
      const typeDiscount = event.target.typeDiscount.value;
      const value = event.target.value.value;
      const minOrderValue = event.target.minOrderValue.value;
      const maxDiscountValue = event.target.maxDiscountValue.value;
      const usageLimit = event.target.usageLimit.value;
      const typeDisplay = event.target.typeDisplay.value;
      const status = event.target.status.value;
      const startDate = event.target.startDate.value;
      const endDate = event.target.endDate.value;
      const description = tinymce.get("description").getContent();

      // Tạo FormData
      const formData = new FormData();
      formData.append("code", code);
      formData.append("name", name);
      formData.append("typeDiscount", typeDiscount);
      formData.append("value", value);
      formData.append("minOrderValue", minOrderValue);
      formData.append("maxDiscountValue", maxDiscountValue);
      formData.append("usageLimit", usageLimit);
      formData.append("typeDisplay", typeDisplay);
      formData.append("status", status);
      formData.append("startDate", startDate);
      formData.append("endDate", endDate);
      formData.append("description", description);

      fetch(`/${pathAdmin}/coupon/edit/${id}`, {
        method: "PATCH",
        body: formData,
      })
        .then((res) => res.json())
        .then((data) => {
          if (data.code == "error") {
            notyf.error(data.message);
          }

          if (data.code == "success") {
            notyf.success(data.message);
          }
        });
    });
}
// End couponEditForm
