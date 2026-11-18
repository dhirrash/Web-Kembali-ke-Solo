<?php
require __DIR__ . "/bootstrap.php";
require_method(["POST"]);
read_json_body();

logout_session();
json_out(["ok" => true]);
