<?php

use DelJdlx\RpgEngine\Area;

ini_set('display_errors', true);

require __DIR__ . '/src/Area.php';



$x = filter_input(INPUT_GET, 'x', FILTER_VALIDATE_INT);
$y = filter_input(INPUT_GET, 'y', FILTER_VALIDATE_INT);

// IMPORTANT
// JDLX_TODO
$file = __DIR__.'/areas/'.$x.'_'.$y.'.json';

if(!is_file($file)) {
    echo '[]';
    return;
}

$json = json_decode(
    file_get_contents($file),
    true,
);

$area = new Area();
$area->loadFromArray($json);

echo json_encode(
    $area->jsonSerialize()
);

