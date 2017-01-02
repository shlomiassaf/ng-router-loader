#!/bin/bash

git checkout master

npm run docs 2> /dev/null

git add docs/docs_dist
git commit -m "generate docs"

if [ $? -eq 0 ]
then
  cp -r ./docs/docs_dist .docs
  git checkout gh-pages
  rm -rf ./assets
  rm -rf ./interfaces
  rm ./index.html
  rm ./globals.html

  mv .docs/* ./
  rm -rf .docs

  git add .
  git commit -m "update docs"
  git push origin gh-pages
  git checkout master

else
  echo "Compilation failed" >&2
fi
