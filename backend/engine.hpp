#include <vector>

class Engine
{
private:
    std::vector<long long> arr;
    void scramble();

public:
    void init(long long quantity, int algorithm);
    long long *get_arr();
    void step();
};