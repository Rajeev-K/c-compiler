int puts(const char *);

void int_to_string(int n, char *buffer) {
    int i;
    int j;
    int digit;
    char temp;
    int is_negative;

    i = 0;
    is_negative = 0;

    if (n < 0) {
        is_negative = 1;
        n = 0 - n;
    }

    if (n == 0) {
        buffer[0] = 48;
        buffer[1] = 0;
        return;
    }

    while (n > 0) {
        digit = n % 10;
        buffer[i] = digit + 48;
        i = i + 1;
        n = n / 10;
    }

    if (is_negative) {
        buffer[i] = 45;
        i = i + 1;
    }

    buffer[i] = 0;

    j = 0;
    i = i - 1;
    while (j < i) {
        temp = buffer[j];
        buffer[j] = buffer[i];
        buffer[i] = temp;
        j = j + 1;
        i = i - 1;
    }
}

void sort(int arr[], int n) {
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

int binary_search(int arr[], int n, int target)
{
    int left;
    int right;
    int mid;

    left = 0;
    right = n - 1;

    while (left <= right)
    {
        mid = (left + right) / 2;

        if (arr[mid] == target)
        {
            return mid;
        }
        else if (arr[mid] < target)
        {
            left = mid + 1;
        }
        else
        {
            right = mid - 1;
        }
    }

    return -1;
}

int main() {
    int arr[5];
    char buffer[20];
    int i;
    int index;

    arr[0] = 5;
    arr[1] = 2;
    arr[2] = 9;
    arr[3] = 1;
    arr[4] = 3;

    sort(arr, 5);

    puts("sorted numbers");
    for (i = 0; i < 5; i = i + 1)
    {
        int_to_string(arr[i], buffer);
        puts(buffer);
    }
    puts("");

    puts("search result");
    index = binary_search(arr, 5, 3);
    int_to_string(index, buffer);
    puts(buffer);

    return 0;
}
