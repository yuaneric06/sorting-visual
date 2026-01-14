#include <vector>
#include <queue>
#include "op.hpp"

class Engine
{
private:
    std::vector<long long> arr;
    std::vector<long long> original_arr;
    void scramble();
    void merge_sort(long long l, long long r);
    void merge(long long l, long long mid, long long r);
    std::queue<Op> ops;

public:
    void init(long long quantity, int algorithm);
    long long *get_arr();
    Op *step();
};