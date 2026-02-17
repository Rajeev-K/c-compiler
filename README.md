# c-compiler
A C compiler written in TypeScript

## Prompt given to Claude

```
Write a simple C compiler in typescript that can compile the program below
to GNU compatible assembly:

int puts(const char *);

void sort(int arr[], int n)
{
    int i;
    int j;
    int temp;

    for (i = 0; i < n - 1; i = i + 1)
    {
        for (j = 0; j < n - 1 - i; j = j + 1)
        {
            if (arr[j] > arr[j + 1])
            {
                temp = arr[j];
                arr[j] = arr[j + 1];
                arr[j + 1] = temp;
            }
        }
    }
}

int main()
{
    int arr[5];
    char buffer[20];
    int i;

    arr[0] = 5;
    arr[1] = 2;
    arr[2] = 9;
    arr[3] = 1;
    arr[4] = 3;

    sort(arr, 5);

    for (i = 0; i < 5; i = i + 1)
    {
        int_to_string(arr[i], buffer);
        puts(buffer);
    }

    return 0;
}
```

Claude wrote the compiler in one shot and it worked the first time!

## What the compiler supports:

- **Types**: `int`, `char`, `void`, pointers, arrays
- **Declarations**: functions, function prototypes, local/global variables
- **Statements**: `if/else`, `for`, `while`, `return`, blocks
- **Expressions**: arithmetic (`+`, `-`, `*`, `/`, `%`), comparisons, logical operators (`&&`, `||`, `!`), array indexing, function calls, assignments, address-of (`&`)

## How to run

### System requirements

- You need a x64 computer.
- I have only tested on a Windows box, but it should run on Linux and macOS as long as it is x64.
- Docker. (I used Docker to avoid having to install TypeScript and GNU assembler/linker.)

### Build and run

To build (run this command in project folder):

```
docker build -t c-compiler .
```

To run  (run this command in project folder):

```
docker run --rm -v .:/workspace c-compiler test.c
```

### Examine the compiler output

The compiler outputs x64 assembly language. The output is placed in `output.s`. It is then assembled and linked and the final output is in the file named `program`.
