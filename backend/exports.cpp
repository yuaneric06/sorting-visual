#include "engine.hpp"

static Engine engine;

extern "C"
{
    void init(int quantity, int algorithm)
    {
        engine.init(quantity, algorithm);
    }

    Op *step()
    {
        return engine.step();
    }

    int *get_op_cnt()
    {
        return engine.get_op_cnt();
    }

    int *get_arr()
    {
        return engine.get_arr();
    }
}