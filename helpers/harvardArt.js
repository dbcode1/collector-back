function harvard() {
  return axios.get(
    `https://api.harvardartmuseums.org/object?keyword=${searchTerm}&size=100&apikey=a27500b4-d744-4b0c-a9b5-cbf8989dc970`
  );
}


// call each api at once with promise all stored in variable so i can grab each result from outside function