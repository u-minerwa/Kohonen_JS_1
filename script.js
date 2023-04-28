const WIDTH = 40, HEIGHT = 40, WIDTH_BLOCK = 10, HEIGHT_BLOCK = 10, Xn = 194, Yn = 114;

let canvas = document.querySelector("#canvas"), 
    context = canvas.getContext("2d"), 
    Ts = [] 

/*
    Функция случайного числа в диапазоне min - max. 
    Аргументы: 
        min: тип данных (вещественное) - от какого числа начинается диапазон случайных чисел.
        max: тип данных (вещественное) - каким числом заканчивается диапазон случайных чисел.
*/
function rnd(min, max){
    return (min + Math.random() * (max-min));
}

/*
    Наполнение массива примеров обучающей выборки. 
    Аргументы: 
        x: тип данных (целое число) - количество строк в пространстве.
        y: тип данных (целое число) - количество ячеек в строке.
*/
function cArr(x,y){
    let step = 2;
    for(let height = 153; height<x; height+=step){
        for(let weight = 45; weight<y; weight+=step){
            let ibm = weight/(height/100)**2;                   //Рассчёт индекса массы тела
            Ts.push([height/x, weight/y, ibm/49]);              //Формирование обучающего примера 
        }
    }

    // let colors = [[255,0,0], [0,255,0], [0,0,255], [255,255,255]];
    // Ts = colors.map((array, indexArray) => array.map(value => value/255));
}

class Neuron{
    /*
        Класс, описывающий один нейрон.
        Аргументы: 
            X: тип данных (целочисленный) - количество входных воздействий;
            x: тип данных (целочисленный) - координата нейрона по горизонтали,
            y: тип данных (целочисленный) - и по вертикали. 
    */

    constructor(X, x, y){
        this.x = x; 
        this.y = y;
        this.w = Array(X).fill(0).map(value => rnd(0,1));   // Инициализация весовых коэффициентов 
        this.color = "rgb(255, 255, 255)";                  // Инициализация цвета нейрона
    }

    render(){
        // Метод осуществляет отображение нейрона на сетке в виде квадрата. 

        context.fillStyle = this.color;                                 //Установление цвета для отрисовки
        context.clearRect(this.x, this.y, WIDTH_BLOCK, HEIGHT_BLOCK);   //Очистка пространства квадратика на канвасе
        context.fillRect(this.x, this.y, WIDTH_BLOCK, HEIGHT_BLOCK);    //Прорисовка квадратика на карте 
    }

    averageWeights(){
        //Рассчитывает среднее значение весовых коэффициентов. 

        this.avg = this.w.reduce((accum, value) => accum+value, 0)/this.w.length;
    }

    recolor(){
        //Изменяет цвет квадратика на карте

        this.averageWeights();      //Рассчёт среднего значения при использовании оттенков серого
        this.color = "rgb("+this.w[0]*255+","+this.w[1]*255+","+this.w[2]*255+")";  //Установка цвета 
        // this.color = "rgb("+this.avg*255+","+this.avg*255+","+this.avg*255+")";
        this.render();              //Прорисовка нейрона на карте 
    }
}

class SOM{
    // Класс описывает СамКартуКохонена. 
    // Аргументы: n: тип данных (целочисленный) - кол-во входных воздействий 

    constructor(n){
        this.neurons = [];
        this.x = 1;
        this.y = 1; 
        this.sigma0 = Math.max(WIDTH*WIDTH_BLOCK, HEIGHT*HEIGHT_BLOCK)/2; 
        this.lambda = 0;
        this.sigma = 0; 
        this.L = 0;
        this.theta = 0; 
        this.r = 0; 
        this.neightbours = []; 

        for(let i=0; i<WIDTH*HEIGHT; i++){                      //Пробегаемся по всем ячейкам сетки
            this.neurons.push(new Neuron(n, this.x, this.y));   //Наполняем массив нейронов экземплярами класса
            if(this.x+WIDTH_BLOCK < WIDTH*WIDTH_BLOCK){         //Если не дошли до правой стенки, то устанавливаем новый нейрон в этой же строке,
                this.x += WIDTH_BLOCK+1;
            } else {                                            //Иначе переходим к левой стенке и опускаемся на новую строку. 
                this.x = 1;
                this.y += HEIGHT_BLOCK+1; 
            }
        }
        this.neurons.forEach(neuron => neuron.render()); // Прорисовываем все нейроны
    }

    recolor(){
        // Метод отображает текущее состояние карты. 

        this.neurons.forEach(value => value.recolor());
    }

    indexMinimum(D){
        //Метод для определения минимального расстояния между нейронами и входным воздействием. 
            // Аргументы: D: тип данных (список) - значения, полученные по формуле корня квадратного суммы квадрата разности. 

        let index = 0, min = D[index];      // Первый элемент списка устанавливаем как минимальный
        for (let i=1; i<D.length; i++){     // Пробегаемся по всем элементам, кроме первого
            if(D[i] < min){
                index = i; 
                min = D[i];
            }
        }
        return index;
    }

    // Метод для определения нейрона-победителя. Аргумент: y: тип данных (список) - входное воздействие. 
    neuronWinner(y){
        this.D = [];    //Список для хранения расстояний между нейронами и входным воздействием
        this.neurons.forEach((neuron, indexNeuron) => {
            this.s = 0;                                         // Переменная для суммирования
            y.forEach((input, indexInput) => {                  // Перебор данных входного воздействия
                this.s += (input - neuron.w[indexInput])**2;    // Суммирование разности квадратов
            })
            this.D.push(Math.sqrt(this.s));     // Добавление расстояния в список 
        })
        return this.indexMinimum(this.D);   // Возвращение индекса победившего нейрона
    }

    // Метод определения нейронов победителей (ближайших к входным воздействиям)
    // Аргумент: y: тип данных (список) - входные воздействия.
    search(y){
        this.neurons.forEach(value => {
            value.color = "rgb(255, 255, 255)"; 
            value.render();     //Очищаем цвета карты
        })
        y.forEach(value => this.neurons[this.neuronWinner(value)].recolor())    //Красим только нейроны-победители
    }

    // Метод обучения нейронов карты. 
    // Аргументы: 
        // T: тип данных (целочисленный) - кол-во итераций обучения
        // L0: тип данных (вещественный) - начальное значение коэф скорости обучения
    learn(T=10, L0=0.33){
        this.lambda = T/Math.log(this.sigma0); //Вычисление лямбды 
        Ts.forEach((value, indexValue) => {
            this.currentWinner = this.neurons[this.neuronWinner(value)] // Получаем нейрон победителя
            for(let t=0; t<T; t++){
                this.sigma = this.sigma0 * Math.exp(-(t/this.lambda))
                this.L = L0 * Math.exp(-(t/this.lambda))    // Вычисляем коэф скорости обучения
                this.neightbours = this.neurons.filter(neuron => Math.sqrt((neuron.x-this.currentWinner.x)**2 + (neuron.y- 
                    this.currentWinner.y)**2) < this.sigma);    // Массив соседей победившего нейрона 
                this.neightbours.forEach((neuron, indexNeuron) => {
                    //Узнаём расстояние до каждого соседа
                    this.r = Math.sqrt((neuron.x-this.currentWinner.x)**2 + (neuron.y-this.currentWinner.y)**2) 
                    this.theta = Math.exp(-((this.r**2)/(2*(this.sigma**2))))

                    neuron.w.forEach((weight, indexWeight) => {
                        this.neightbours[indexNeuron].w[indexWeight] += this.theta*this.L*(value[indexWeight] - weight); //Корректируем весовые коэф.
                    })
                })
            }
        })
        this.recolor();     //Перерисовка карты после обучения. 
    }
}

nn = new SOM(3);    //Создаём экземпляр класса самоорганизующейся карты 

window.onload = () => {cArr(Xn, Yn);} // Вызываем функцию для инициализации входных воздействий. 

