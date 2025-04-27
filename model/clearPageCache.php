<?php
      // Thêm header để ngăn cache trang
      header("Cache-Control: no-store, no-cache, must-revalidate, max-age=0");
      header("Cache-Control: post-check=0, pre-check=0", false);
      header("Pragma: no-cache");
      header("Expires: Thu, 01 Jan 1970 00:00:00 GMT");

      // Trả về HTTP 204 No Content
      http_response_code(204);
?>