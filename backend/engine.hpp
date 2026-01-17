#include <vector>
#include <queue>
#include "op.hpp"

class Engine
{
private:
    std::vector<int> arr;
    std::vector<int> original_arr;
    void scramble();
    void merge_sort(int l, int r);
    void merge(int l, int mid, int r);
    void quick_sort(int l, int r);
    int partition(int l, int r);
    void bubble_sort();
    void selection_sort();
    void insertion_sort();
    void heapify(int n, int root);
    void heap_sort();
    void cycle_sort();
    std::queue<Op> ops;
    static int op_cnt;

public:
    void init(int quantity, int algorithm);
    int *get_arr();
    int *get_op_cnt();
    Op *step();
};