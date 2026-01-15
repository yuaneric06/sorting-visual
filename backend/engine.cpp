#include "engine.hpp"
#include <cstdlib>
#include <ctime>
#include <utility>
#include <iostream>

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
    for (long long i = 1; i <= quantity; i++)
    {
        arr[i - 1] = i;
    }
    std::cout << "initialized\n";
    scramble();
    std::cout << "scrambled\n";
    original_arr = arr;
    if (algorithm == 1)
    { // merge sort
        merge_sort(0, quantity - 1);
        std::cout << "merge sort complete\n";
        for (long long a : arr)
        {
            std::cout << a << " ";
        }
        std::cout << "\n";
    }
    else if (algorithm == 2)
    {
        // quick sort
        quick_sort(0, quantity - 1);
        std::cout << "quick sort complete\n";
        for (long long a : arr)
        {
            std::cout << a << " ";
        }
        std::cout << "\n";
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