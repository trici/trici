#!/bin/bash
echo "Updating binaries..."
echo "Deleting bin directory..."
rm -rf bin
echo "Creating bin directory..."
mkdir bin
echo "Copying textract binaries..."
cp -r ../textract/bin bin
echo "Done!"