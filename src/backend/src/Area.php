<?php
namespace DelJdlx\RpgEngine;

use JsonSerializable;

class Area implements JsonSerializable
{
    private $elements = [];

    public function add(string $name, $x, $y, $element)
    {
        $this->elements[] = [
            'name' => $name,
            'x' => $x,
            'y' => $y,
            'element' => $element,
        ];
    }

    public function loadFromArray(array $descriptor)
    {
        foreach ($descriptor as $elementDescriptor) {
            $this->add(
                $elementDescriptor['name'],
                $elementDescriptor['x'],
                $elementDescriptor['y'],
                $elementDescriptor['element'],
            );
        }
    }

    public function jsonSerialize(): mixed
    {
        return $this->elements;
    }
}


