<?php

use DelJdlx\RpgEngine\Area;

ini_set('display_errors', true);

require __DIR__ . '/src/Area.php';



$json = file_get_contents("php://input");
$data = json_decode($json, true);

$x = $data['x'];
$y = $data['y'];
$areaData = $data['data'];

// IMPORTANT
// JDLX_TODO
$file = __DIR__.'/areas/'.$x.'_'.$y.'.json';

// if(is_file($file)) {
    file_put_contents(
        $file,
        json_encode($areaData, JSON_PRETTY_PRINT)
    );
    echo json_encode($data);
    return;
// }

echo '[]';
return;







$json = json_decode(
    file_get_contents($file),
    true,
);

$area = new Area();
$area->loadFromArray($json);

echo json_encode(
    $area->jsonSerialize()
);


