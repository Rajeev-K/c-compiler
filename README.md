# c-compiler
A C compiler written in TypeScript

## Prompt given to Claude

```
Write a simple C compiler in typescript that can compile the program below to GNU compatible assembly:

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
```

Claude wrote the compiler in one shot and it worked the first time!

## What the compiler supports:

- **Types**: `int`, `char`, `void`, pointers, arrays
- **Declarations**: functions, function prototypes, local/global variables
- **Statements**: `if/else`, `for`, `while`, `return`, blocks
- **Expressions**: arithmetic (`+`, `-`, `*`, `/`, `%`), comparisons, logical operators (`&&`, `||`, `!`), array indexing, function calls, assignments, address-of (`&`)

