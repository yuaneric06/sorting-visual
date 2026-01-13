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
    arr.resize(quantity);
    std::cout << "a";
    for (long long i = 1; i <= quantity; i++)
    {
        arr[i - 1] = i;
    }
    std::cout << "initialized\n";
    scramble();
    std::cout << "scrambled\n";
    for (auto a : arr)
    {
        std::cout << a << " ";
    }
    std::cout << "\n";
}

long long *Engine::get_arr()
{
    return arr.data();
}

void Engine::step()
{
    std::cout << "stepping\n";
}