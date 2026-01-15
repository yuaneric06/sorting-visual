#include "engine.hpp"
#include <cstdlib>
#include <ctime>
#include <utility>
#include <iostream>

long long Engine::op_cnt = 0;

void Engine::scramble()
{
    std::srand(static_cast<unsigned int>(std::time(nullptr)));
    for (int i = arr.size() - 1; i > 0; i--)
    {
        int randIdx = std::rand() % i;
        std::swap(arr[i], arr[randIdx]);
    }
}

void Engine::init(long long quantity, int algorithm)
{
    std::cout << "running the " << algorithm << " algorithm with " << quantity << " units\n";
    op_cnt = 0;
    arr.resize(quantity);
    while (!ops.empty())
        ops.pop();
    for (long long i = 1; i <= quantity; i++)
    {
        arr[i - 1] = i;
    }
    std::cout << "initialized\n";
    scramble();
    std::cout << "scrambled\n";
    original_arr = arr;
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
    }
}

long long *Engine::get_arr()
{
    return original_arr.data();
}

long long *Engine::get_op_cnt()
{
    return &op_cnt;
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
    return op;
}

void Engine::merge(long long l, long long mid, long long r)
{
    long long k = l;
    long long n1 = mid - l + 1;
    long long n2 = r - mid;
    std::vector<long long> left_arr(n1);
    std::vector<long long> right_arr(n2);

    for (long long i = 0; i < n1; i++)
    {
        left_arr[i] = arr[i + l];
    }
    for (long long i = 0; i < n2; i++)
    {
        right_arr[i] = arr[i + mid + 1];
    }

    long long i = 0, j = 0;
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

void Engine::merge_sort(long long l, long long r)
{
    if (l >= r)
    {
        return;
    }

    long long mid = l + (r - l) / 2;
    merge_sort(l, mid);
    merge_sort(mid + 1, r);
    merge(l, mid, r);
}

void Engine::quick_sort(long long l, long long r)
{
    if (l < r)
    {
        long long pi = partition(l, r);
        quick_sort(l, pi - 1);
        quick_sort(pi + 1, r);
    }
}

long long Engine::partition(long long l, long long r)
{
    long long i = l - 1, j = l;
    long long pivot = arr[r];
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
    for (long long i = 0; i < arr.size(); i++)
    {
        for (long long j = 1; j < arr.size(); j++)
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
    for (long long i = 0; i < arr.size() - 1; i++)
    {
        long long min_idx = i;
        for (long long j = i + 1; j < arr.size(); j++)
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
    for (long long i = 1; i < arr.size(); i++)
    {
        long long key = arr[i];
        long long j = i - 1;
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

void Engine::heapify(long long n, long long root)
{
    long long largest = root;
    long long left = root * 2 + 1;
    long long right = root * 2 + 2;

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
    long long n = arr.size();
    for (long long i = n / 2 - 1; i >= 0; i--)
    {
        heapify(n, i);
    }

    for (long long i = n - 1; i >= 0; i--)
    {
        std::swap(arr[0], arr[i]);
        ops.push({0, arr[0]});
        ops.push({i, arr[i]});
        heapify(i, 0);
    }
}
