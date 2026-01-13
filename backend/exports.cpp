#include "engine.hpp"

static Engine engine;

extern "C"
{
    void init(long long quantity, int algorithm)
    {
        engine.init(quantity, algorithm);
    }

    void step()
    {
        engine.step();
    }

    long long *get_arr()
    {
        return engine.get_arr();
    }
}