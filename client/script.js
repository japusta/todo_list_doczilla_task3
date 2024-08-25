$(document).ready(function() {
    let startDate;
    let endDate;
    // Установка сегодняшней даты при загрузке страницы
    function setTodayDate() {
        let today = new Date();
        today.setHours(0, 0, 0, 0); // Начало дня
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999); // Конец дня
        $('.task-date').text(today.toLocaleDateString());
        fetchTasks(); // Загрузка задач на сегодня при открытии
    }

    // Функция для преобразования даты в метку времени (timestamp)
    function getTimestamp(date) {
        if (date instanceof Date && !isNaN(date)) {
            return date.getTime();
        } else if (typeof date === 'string') {
            date = new Date(date);
            return date.getTime();
        }
        return null;
    }
    // Функция для получения задач с учетом фильтров и поиска
    function fetchTasks() {
        if (!startDate || !endDate) {
            $('#tasks-list').empty(); // Очистка списка задач, если даты не выбраны (если не выбрано второе число из диапазона)
            return;
        }

        let requestData = {
            q: $('#search').val(), // Название задачи
            startDate: getTimestamp(startDate),
            endDate: getTimestamp(endDate),
            status: $('#incomplete-checkbox').is(':checked') ? false : undefined
        };

        $.ajax({
            url: 'http://localhost:3000/proxy-endpoint',
            method: 'GET',
            data: requestData,
            success: function(data) {
                displayTasks(data);
            },
            error: function() {
                alert('Error fetching tasks.');
            }
        });
    }

    // Функция для сортировки задач
    function sortTasks(tasks) {
        if ($('#sort-checkbox').is(':checked')) {
            return tasks.sort((a, b) => new Date(a.date) - new Date(b.date));
        }
        return tasks; // Без сортировки
    }

    // Функция для отображения списка задач
    function displayTasks(tasks) {
        const sortedTasks = sortTasks(tasks);
        $('#tasks-list').empty();
        sortedTasks.forEach(task => {
            const taskDate = new Date(task.date);
            const taskItem = $(`
                <li class="task-item ${task.status ? 'completed' : ''}" data-task-id="${task.id}">
                    <div class="task-info">
                        <strong>${task.name}</strong>
                        <p>${task.shortDesc}</p>
                    </div>
                    <div class="task-meta">
                        <div class="checkbox-wrapper">
                            <img src="./img/Vector-background.svg" class="checkbox-background">
                            ${task.status ? '<img src="./img/Vector-foreground.svg" class="checkbox-foreground">' : ''}
                        </div>
                        <div class="date-wrapper">
                            <span class="date-span-list">${taskDate.toLocaleDateString()} ${taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                    </div>
                </li>
            `);
            taskItem.on('click', function() {
                displayTaskDetails(task); // Показать детали задачи
            });
            $('#tasks-list').append(taskItem);
        });
    }

    // Функция для отображения деталей задачи
    function displayTaskDetails(task) {
        const taskDate = new Date(task.date);
        $('#task-details').html(`
            <div class="task-header-modal">
                <h2>${task.name}</h2>
                <div class="status-icon-wrapper">
                    <div class="status-icon">
                        <img src="./img/Vector-background.svg" class="checkbox-background">
                        ${task.status ? '<img src="./img/Vector-foreground.svg" class="checkbox-foreground">' : ''}
                    </div>
                </div>
            </div>
            <p class="date-bottom"><strong></strong> ${taskDate.toLocaleDateString()} ${taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
            <p><strong>Краткое описание:</strong> ${task.shortDesc || 'Нет краткого описания'}</p>
            <p><strong>Полное описание:</strong> ${task.fullDesc || 'Нет полного описания'}</p>
        `);
    
        $('#task-modal').dialog({
            autoOpen: false,
            modal: true,
            width: 400,
            dialogClass: 'no-titlebar',
            closeOnEscape: true,
            closeText: "Закрыть",
            buttons: {}
        }).dialog('open');
    }

    // Обработчики для элементов сортировки 
    $('#sort-checkbox').change(function() {
        $('#search').val(''); // Сброс поиска
        fetchTasks(); // Обновление задач с учетом сортировки
    });

    $('#incomplete-checkbox').change(function() {
        $('#search').val(''); // Сброс поиска
        fetchTasks(); // Обновление задач с учетом фильтрации
    });

    // Закрытие модального окна при нажатии на кнопку "Готово"
    $('#close-task-btn').on('click', function() {
        $('#task-modal').dialog('close');
    });

    // Настройка автозаполнения (поиска) с выводом названия и даты
    $('#search').autocomplete({
        source: function(request, response) {
            $.ajax({
                url: 'http://localhost:3000/proxy-endpoint',
                method: 'GET',
                data: {
                    q: request.term, // Поиск по названию
                    startDate: startDate ? getTimestamp(startDate) : undefined,
                    endDate: endDate ? getTimestamp(endDate) : undefined
                },
                success: function(data) {
                    response($.map(data, function(task) {
                        const taskDate = new Date(task.date);
                        return {
                            label: `${task.name} - ${taskDate.toLocaleDateString()} ${taskDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`,
                            value: task.name,
                            task: task
                        };
                    }));
                }
            });
        },
        select: function(event, ui) {
            displayTaskDetails(ui.item.task); // Отображение выбранной задачи при выборе из выпадающего списка
        }
    });

    // Настройка календаря для выбора диапазона дат
    $('#calendar').datepicker({
        numberOfMonths: 1, // Один календарь
        onSelect: function(dateText, inst) {
            let date = $(this).datepicker('getDate');
            if (!startDate || endDate) {
                startDate = date;
                endDate = null;
            } else {
                endDate = date;
                endDate.setHours(23, 59, 59, 999); // Установка конца дня для конца диапазона
                if (startDate.getTime() === endDate.getTime()) {
                    // Если выбран один и тот же день, устанавливаем конец дня для endDate
                    endDate.setHours(23, 59, 59, 999);
                } else if (startDate > endDate) {
                    let temp = startDate;
                    startDate = endDate;
                    endDate = temp;
                }
            }
            fetchTasks(); // Загрузка задач для выбранного диапазона
            $(this).datepicker('refresh');  // Подсветка выбранного диапазона
        },
        beforeShowDay: function(date) {
            if (!startDate || !endDate) {
                return [true, ""];
            }
            if (date >= startDate && date <= endDate) {
                return [true, "ui-state-highlight"];
            }
            return [true, ""];
        }
    });

    // Кнопка "Сегодня"
    $('#today-btn').click(function() {
        let today = new Date();
        today.setHours(0, 0, 0, 0); // Начало дня
        startDate = new Date(today);
        endDate = new Date(today);
        endDate.setHours(23, 59, 59, 999); // Конец дня
        setTodayDate(); // Установить дату в интерфейсе
        fetchTasks();
    });

    // Кнопка "Эта неделя"
    $('#week-btn').click(function() {
        let today = new Date();
        let startOfWeek = new Date(today.setDate(today.getDate() - today.getDay()));
        let endOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 6));
        startDate = startOfWeek;
        endDate = endOfWeek;
        endDate.setHours(23, 59, 59, 999); // Установить конец дня для последнего дня недели
        fetchTasks();
    });

    setTodayDate(); // Установка даты в интерфейсе при загрузке страницы
});
