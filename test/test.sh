#!/usr/bin/env bash

echo "FOO: $FOO"
echo "BAR: $BAR"

if [[ ! -v FOO2 ]]; then
    echo "FOO2 is not set"
elif [[ -z "$FOO2" ]]; then
    echo "FOO2 is set to the empty string"
else
    echo "FOO2 has the value: $FOO2"
fi
