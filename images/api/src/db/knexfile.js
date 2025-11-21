// Update with your config settings.

/**
 * @type { Object.<string, import("knex").Knex.Config> }
 */
module.exports = {

  development: {
    client: 'pg',
    connection: {
      host : process.env.POSTGRES_HOST ? process.env.POSTGRES_HOST : "localhost",
      port : 5432,
      user : process.env.POSTGRES_USER ? process.env.POSTGRES_USER : "admin",
      password : process.env.POSTGRES_PASSWORD ? process.env.POSTGRES_PASSWORD : "test",
      database : process.env.POSTGRES_DATABASE ? process.env.POSTGRES_DATABASE : "postgres"
    }
  },


};
