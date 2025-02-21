#!/bin/bash

# Trouver l’IP locale de l’hôte sur le réseau Docker
IP=$(ip addr show docker0 | grep "inet " | awk '{print $2}' | cut -d/ -f1)

# Vérifier si LOCAL_IP existe déjà dans .env
if grep -q "^LOCAL_IP=" .env; then
    # Modifier la ligne existante
    sed -i "s/^LOCAL_IP=.*/LOCAL_IP=$IP/" .env
else
    # Ajouter LOCAL_IP si elle n'existe pas
    echo "LOCAL_IP=$IP" >> .env
fi

# Afficher le résultat pour vérification
echo "Mise à jour du fichier .env : LOCAL_IP=$IP"
