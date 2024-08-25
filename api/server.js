const express = require('express');
const axios = require('axios');
const app = express();
const PORT = 3000;

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    next();
});

// Прокси для получения всех задач с возможностью фильтрации по названию
app.get('/proxy-endpoint', async (req, res) => {
    try {
        const { startDate, endDate, status, q, limit, offset } = req.query;
        let apiUrl = '';

        // Если присутствует параметр для поиска по названию
        if (q) {
            apiUrl = `https://todo.doczilla.pro/api/todos/find?q=${q}`;
        } 
        // Если указаны даты и статус
        else if (startDate && endDate) {
            apiUrl = `https://todo.doczilla.pro/api/todos/date?from=${startDate}&to=${endDate}`;
            if (status !== undefined) {
                apiUrl += `&status=${status}`;
            }
        } 
        // Получение всех задач с лимитом и смещением
        else {
            apiUrl = `https://todo.doczilla.pro/api/todos?limit=${limit || 10}&offset=${offset || 0}`;
        }

        console.log(`Fetching data from: ${apiUrl}`); // Лог URL запроса

        const response = await axios.get(apiUrl);
        res.send(response.data);
    } catch (error) {
        console.error('Error fetching data:', error.message);
        console.error('Error details:', error.response?.data || error);
        res.status(500).send('Error fetching data');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
