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
    void quick_sort(long long l, long long r);
    long long partition(long long l, long long r);
    void bubble_sort();
    void selection_sort();
    void insertion_sort();
    void heapify(long long n, long long root);
    void heap_sort();
    std::queue<Op> ops;
    static long long op_cnt;

public:
    void init(long long quantity, int algorithm);
    long long *get_arr();
    long long *get_op_cnt();
    Op *step();
};