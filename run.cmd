cd %~dp0

docker run --rm -v "%cd%":/workspace c-compiler test.c
