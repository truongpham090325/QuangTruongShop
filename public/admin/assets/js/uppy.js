import {
  Uppy,
  Dashboard,
  XHRUpload,
} from "https://releases.transloadit.com/uppy/v5.2.1/uppy.min.mjs";
const uppy = new Uppy();

const uppyUpload = document.querySelector("#uppy-upload");
if (uppyUpload) {
  uppy.use(Dashboard, {
    target: "#uppy-upload",
    inline: true,
    width: "100%",
  });

  const urlParams = new URLSearchParams(window.location.search);
  const folderPath = urlParams.get("folderPath") || "";

  uppy.use(XHRUpload, {
    endpoint: `/${pathAdmin}/file-manager/upload?folderPath=${folderPath}`, // backend nhận được file tại đường dẫn này
    fieldName: "files",
    bundle: true,
  });

  uppy.on("complete", (result) => {
    if (result.successful.length > 0) {
      drawNotify(
        "success",
        `Upload thành công ${result.successful.length} file!`,
      );
    }
    if (result.failed.length > 0) {
      drawNotify("error", `Upload thất bại ${result.failed.length} file!`);
    }
    window.location.reload();
  });
}
