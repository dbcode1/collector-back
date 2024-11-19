const axios = require("axios");
const {
  harvardFormatter,
  rijkArtObject,
  clevelandArtObject,
  metArtFormatter,
} = require("../helpers/artObject");

exports.search = async (req, res) => {
  console.log("search");
  let allArt = [];
  let allArtic = [];
  const searchTerm = req.query.q;

  // Art Institute

  const articCall = async (searchTerm) => {
    const apiCall1 = await axios.get(
      `https://api.artic.edu/api/v1/artworks/search?q=${searchTerm}`
    );

    await Promise.all(
      apiCall1.data.data.map(async (entry) => {
        const subApiCall = await axios.get(
          `https://api.artic.edu/api/v1/artworks/${entry.id}?fields=id,title,image_id`
        );
        console.log("entry", subApiCall.data);
        const url = `${subApiCall.data.config.iiif_url}/${subApiCall.data.data.image_id}/full/843,/0/default.jpg`;
        console.log(subApiCall.data.data.title);
        const artObj = {
          name: "",
          title: subApiCall.data.data.title,
          img: url,
          caption: "",
          date: "",
          containerTitle: "",
        };

        allArtic.push(artObj);
      })
    );

    //console.log("new refactored code", allArtic);
  };

  // MET ART

  const metArt = () =>
    axios.get(
      `https://www.metmuseum.org/api/collection/collectionlisting?q=${searchTerm}&sortBy=Relevance&sortOrder=asc&perPage=20&showOnly=openaccess`
    );

  const harvard = () =>
    axios.get(
      `https://api.harvardartmuseums.org/object?keyword=${searchTerm}&size=100&apikey=a27500b4-d744-4b0c-a9b5-cbf8989dc970`
    );

  const rijk = () =>
    axios.get(
      `https://www.rijksmuseum.nl/api/en/collection?key=DwmWUAgf&q=${searchTerm}&ps=100&imgonly=True&toppieces=True`
    );

  const clev = () =>
    axios.get(
      `https://openaccess-api.clevelandart.org/api/artworks/?artists=${searchTerm}&has_image&limit=50`
    );
  //Promise.all([metArt(), harvard(), rijk(), clev(), articCall(searchTerm)])
  Promise.all([harvard(), rijk(), clev(), articCall(searchTerm)])
    .then((response) => {
      //console.log("all", allArt);
      // const met = response[0].data;
      // const harvard = response[].data;
      // const rijk = response[2].data;
      // const clev = response[3].data;

      // const met = response[0].data;
      const harvard = response[0].data;
      const rijk = response[1].data;
      const clev = response[2].data;

      // format data()
      // const metFormatted = metArtFormatter(met, searchTerm);

      const harvardFormatted = harvardFormatter(harvard, searchTerm);

      const rijkFormatted = rijkArtObject(rijk, searchTerm);

      const clevFormatted = clevelandArtObject(clev, searchTerm);

      allArt = [
        ...allArtic,
        // ...metFormatted,
        ...harvardFormatted,
        ...rijkFormatted,
        ...clevFormatted,
      ];
      if (allArt.length === 0) {
        return res.status(400).send({ message: "No Results" });
      } else {
        return res.status(200).json(allArt);
      }
    })
    .catch((err) => {
      res.json({ message: err.message });
    });
};
