#!/usr/bin/env bash

rm -rf data
if [ "$(uname)" ==  "Darwin" ];then
 rm -rf $HOME/Library/Application\ Support/TriciDev
else
 rm -rf $HOME/.config/TriciDev
fi


