//connectionString: a causa di un bug di node.js, la variabile di ambiente process.env.DATABASE_URL potrebbe essere undefined, 
//in quel caso utilizzo il link diretto per il database online di heroku
var connectionString = process.env.DATABASE_URL || 
	'postgres://keyivvkxtdtdvz:dtrZkEkbep1o7SjFYF9APp_T4F@ec2-54-235-177-45.compute-1.amazonaws.com:5432/d6dc0imrseapqc?ssl=true';

var pg = require('pg');

//funzione per eseguire una singola query
function launchQuery(queryString,callback){
	//connetto pg
	pg.connect(
		//link del database
		connectionString, 
		//funzione di callback eseguita alla fine della query
		function(err, client, done) {
		client.query(queryString, function(err, result) {
			//release the client back to the pool
			done();
			//gestisco errore chiamando subito la callback con error = true e result = null
			if (err){ 
				callback(true, null);
		  	}
			//altrimenti chiamo la callback con error = false e result = array delle righe risultate dalla query
		  	else {
				callback(false, result.rows);
		  	}
		});
  	});
}

//funzione ricorsiva per eseguire un array di query in sequenza. Ogni query è eseguita quando la precedente è stata completata.
//La funzione di callback è chiamata solamente quando tutte le query sono state eseguite correttamente o in caso di errore.
//Il caso base è riportato all'inizio: quando l'indice dell'array supera la lunghezza dell'array vuol dire che sono state eseguite tutte le query.
//Nell'implementazione attuale non permette di eseguire query che si aspettano un risultato di ritorno, ma solo query di tipo update/delete/insert
function launchDeepQuery(queryString,q,callback){
	if(q >= queryString.length){
		console.log("Profondità massima raggiunta, ritorno ok");
		callback(false);
	} else{
		//connect to database
		pg.connect(
			//enviromental variable, set by heroku when first databse is created
			connectionString, 
			function(err, client, done) {
				//query
				client.query(queryString[q], function(err, result) {
					//release the client back to the pool
					done();

					if(err){
						console.log("Errore, ritorno male");
						callback(true);
					} else{
						console.log("Ricorro con q:" + q);
						launchDeepQuery(queryString,q+1,callback);
					}
				});
		});
	}
}

//esporto le due funzioni per poterle utilizzare all'esterno di questa classe
exports.launchQuery = launchQuery;
exports.launchDeepQuery = launchDeepQuery;

