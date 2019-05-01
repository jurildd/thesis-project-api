const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'test',
        database: 'thesis-project'
    }
});

async const getAllFiles = () => {
    const data = await db.select('*').from('files').then(data => {
        return data;
    });
    return data;
}

module.exports = {
    getAllFiles
}
