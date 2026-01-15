#include "engine.hpp"

static Engine engine;

extern "C"
{
    void init(long long quantity, int algorithm)
    {
        engine.init(quantity, algorithm);
    }

    Op *step()
    {
        return engine.step();
    }

    long long *get_op_cnt()
    {
        return engine.get_op_cnt();
    }

    long long *get_arr()
    {
        return engine.get_arr();
    }
}