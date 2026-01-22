#include "engine.hpp"
#include <cstdlib>
#include <ctime>
#include <utility>
#include <iostream>
#include <chrono>

int Engine::op_cnt = 0;
long long Engine::runtime = 0;

void Engine::scramble()
{
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    for (int i = arr.size() - 1; i > 0; i--)
    {
        int randIdx = std::rand() % i;
        std::swap(arr[i], arr[randIdx]);
    }
}

void Engine::init(int quantity, int algorithm)
{
    // std::cout << "running the " << algorithm << " algorithm with " << quantity << " units\n";
    op_cnt = 0;
    runtime = 0;
    arr.resize(quantity);
    while (!ops.empty())
        ops.pop();
    for (int i = 1; i <= quantity; i++)
    {
        arr[i - 1] = i;
    }
    scramble();
    // std::cout << "array of size " << quantity << " has been scrambled\n";
    original_arr = arr;
    auto start = std::chrono::steady_clock::now();
    switch (algorithm)
    {
    case 0:
        merge_sort(0, quantity - 1);
        break;
    case 1:
        insertion_sort();
        break;
    case 2:
        quick_sort(0, quantity - 1);
        break;
    case 3:
        selection_sort();
        break;
    case 4:
        bubble_sort();
        break;
    case 5:
        heap_sort();
        break;
    case 6:
        cycle_sort();
        break;
    case 7:
        three_way_merge_sort(0, quantity - 1);
        break;
    case 8:
        bogo_sort();
        break;
    case 9:
        stalin_sort();
        break;
    }
    auto end = std::chrono::steady_clock::now();
    auto duration = std::chrono::duration_cast<std::chrono::milliseconds>(end - start);
    runtime = duration.count();
}

int *Engine::get_arr()
{
    return original_arr.data();
}

int *Engine::get_op_cnt()
{
    return &op_cnt;
}

long long *Engine::get_runtime()
{
    return &runtime;
}

Op *Engine::step()
{
    if (ops.empty())
    {
        static Op op = {-1, -1};
        return &op;
    }
    Op *op = &ops.front();
    op_cnt++;
    ops.pop();
    original_arr[(*op).idx] = (*op).val;
    return op;
}

void Engine::merge(int l, int mid, int r)
{
    int k = l;
    int n1 = mid - l + 1;
    int n2 = r - mid;
    std::vector<int> left_arr(n1);
    std::vector<int> right_arr(n2);

    for (int i = 0; i < n1; i++)
    {
        left_arr[i] = arr[i + l];
    }
    for (int i = 0; i < n2; i++)
    {
        right_arr[i] = arr[i + mid + 1];
    }

    int i = 0, j = 0;
    while (i < n1 && j < n2)
    {
        if (left_arr[i] < right_arr[j])
        {
            arr[k] = left_arr[i];
            k++, i++;
        }
        else
        {
            arr[k] = right_arr[j];
            k++, j++;
        }
        ops.push({k - 1, arr[k - 1]});
    }

    while (i < n1)
    {
        arr[k] = left_arr[i];
        ops.push({k, arr[k]});
        i++;
        k++;
    }

    while (j < n2)
    {
        arr[k] = right_arr[j];
        ops.push({k, arr[k]});
        j++;
        k++;
    }
}

void Engine::merge_sort(int l, int r)
{
    if (l >= r)
    {
        return;
    }

    int mid = l + (r - l) / 2;
    merge_sort(l, mid);
    merge_sort(mid + 1, r);
    merge(l, mid, r);
}

void Engine::quick_sort(int l, int r)
{
    if (l < r)
    {
        int pi = partition(l, r);
        quick_sort(l, pi - 1);
        quick_sort(pi + 1, r);
    }
}

int Engine::partition(int l, int r)
{
    int i = l - 1, j = l;
    int pivot = arr[r];
    while (j < r)
    {
        if (arr[j] < pivot)
        {
            i++;
            std::swap(arr[i], arr[j]);
            ops.push({j, arr[j]});
            ops.push({i, arr[i]});
        }
        j++;
    }
    std::swap(arr[i + 1], arr[r]);
    ops.push({r, arr[r]});
    ops.push({i + 1, arr[i + 1]});
    return i + 1;
}

void Engine::bubble_sort()
{
    bool swapped = false;
    for (int i = 0; i < arr.size(); i++)
    {
        for (int j = 1; j < arr.size(); j++)
        {
            if (arr[j] < arr[j - 1])
            {
                std::swap(arr[j], arr[j - 1]);
                ops.push({j, arr[j]});
                ops.push({j - 1, arr[j - 1]});
                swapped = true;
            }
        }
        if (!swapped)
            break;
    }
}

void Engine::selection_sort()
{
    for (int i = 0; i < arr.size() - 1; i++)
    {
        int min_idx = i;
        for (int j = i + 1; j < arr.size(); j++)
        {
            if (arr[j] < arr[min_idx])
            {
                min_idx = j;
            }
        }
        std::swap(arr[i], arr[min_idx]);
        ops.push({min_idx, arr[min_idx]});
        ops.push({i, arr[i]});
    }
}

void Engine::insertion_sort()
{
    for (int i = 1; i < arr.size(); i++)
    {
        int key = arr[i];
        int j = i - 1;
        while (j >= 0 && arr[j] > key)
        {
            arr[j + 1] = arr[j];
            ops.push({j + 1, arr[j + 1]});
            j--;
        }
        arr[j + 1] = key;
        ops.push({j + 1, arr[j + 1]});
    }
}

void Engine::heapify(int n, int root)
{
    int largest = root;
    int left = root * 2 + 1;
    int right = root * 2 + 2;

    if (left < n && arr[left] > arr[largest])
    {
        largest = left;
    }
    if (right < n && arr[right] > arr[largest])
    {
        largest = right;
    }

    if (largest != root)
    {
        std::swap(arr[largest], arr[root]);
        ops.push({largest, arr[largest]});
        ops.push({root, arr[root]});
        heapify(n, largest);
    }
}

void Engine::heap_sort()
{
    int n = arr.size();
    for (int i = n / 2 - 1; i >= 0; i--)
    {
        heapify(n, i);
    }

    for (int i = n - 1; i >= 0; i--)
    {
        std::swap(arr[0], arr[i]);
        ops.push({0, arr[0]});
        ops.push({i, arr[i]});
        heapify(i, 0);
    }
}

void Engine::cycle_sort()
{
    int n = arr.size();
    for (int i = 0; i < n - 1; i++)
    {
        int item = arr[i];
        int pos = i;
        for (int j = i + 1; j < n; j++)
        {
            if (arr[j] < item)
            {
                pos++;
            }
        }

        if (pos == i)
            continue;

        while (arr[pos] == item)
            pos++;

        if (pos != i)
        {
            std::swap(arr[pos], item);
            ops.push({i, arr[i]});
            ops.push({pos, arr[pos]});
        }

        while (pos != i)
        {
            pos = i;
            for (int j = i + 1; j < n; j++)
            {
                if (arr[j] < item)
                    pos++;
            }

            while (item == arr[pos])
                pos++;

            if (item != arr[pos])
            {
                std::swap(item, arr[pos]);
                ops.push({i, arr[i]});
                ops.push({pos, arr[pos]});
            }
        }
    }
}

void Engine::three_way_merge(int l, int mid1, int mid2, int r)
{
    int len1 = mid1 - l + 1;
    int len2 = mid2 - mid1;
    int len3 = r - mid2;

    std::vector<int> arr1(len1), arr2(len2), arr3(len3);

    for (int i = 0; i < len1; i++)
    {
        arr1[i] = arr[l + i];
    }
    for (int i = 0; i < len2; i++)
    {
        arr2[i] = arr[mid1 + i + 1];
    }
    for (int i = 0; i < len3; i++)
    {
        arr3[i] = arr[mid2 + i + 1];
    }

    int k = l;
    int i = 0, j = 0, h = 0;
    while (i < len1 || j < len2 || h < len3)
    {
        int min_val = INT_MAX, min_idx = -1;

        if (i < len1 && arr1[i] <= min_val)
        {
            min_val = arr1[i];
            min_idx = 0;
        }
        if (j < len2 && arr2[j] <= min_val)
        {
            min_val = arr2[j];
            min_idx = 1;
        }
        if (h < len3 && arr3[h] <= min_val)
        {
            min_val = arr3[h];
            min_idx = 2;
        }

        if (min_idx == 0)
        {
            arr[k] = arr1[i];
            i++;
        }
        else if (min_idx == 1)
        {
            arr[k] = arr2[j];
            j++;
        }
        else
        {
            arr[k] = arr3[h];
            h++;
        }
        ops.push({k, arr[k]});
        k++;
    }
}

void Engine::three_way_merge_sort(int l, int r)
{
    if (l >= r)
    {
        return;
    }

    int mid1 = l + (r - l) / 3;
    int mid2 = l + (r - l) / 3 * 2;

    three_way_merge_sort(l, mid1);
    three_way_merge_sort(mid1 + 1, mid2);
    three_way_merge_sort(mid2 + 1, r);

    three_way_merge(l, mid1, mid2, r);
}

void Engine::bogo_scramble()
{
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    for (int i = arr.size() - 1; i > 0; i--)
    {
        int randIdx = std::rand() % i;
        std::swap(arr[i], arr[randIdx]);
        ops.push({i, arr[i]});
        ops.push({randIdx, arr[randIdx]});
    }
}

void Engine::bogo_sort()
{
    while (!is_sorted())
    {
        bogo_scramble();
    }
}

bool Engine::is_sorted()
{
    for (int i = 1; i < arr.size(); i++)
    {
        if (arr[i] < arr[i - 1])
            return false;
    }
    return true;
}

void Engine::stalin_sort()
{
    int curr = arr[0];
    for (int i = 1; i < arr.size(); i++)
    {
        if (arr[i] < curr)
        {
            ops.push({i, 0});
        }
        else
        {
            curr = arr[i];
        }
    }
}
