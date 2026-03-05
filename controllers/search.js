const axios = require("axios");
const {
  harvardFormatter,
  rijkArtObject,
  metArtFormatter,
} = require("../helpers/artObject");

exports.search = async (req, res) => {
  console.log("search");
  let allArt = [];
  let allArtic = [];
  let metArtObjs = [];
  const searchTerm = req.query.q;

  // Art Institute

  const articCall = async (searchTerm) => {
    console.log("artic call");
    const apiCall1 = await axios.get(
      `https://api.artic.edu/api/v1/artworks/search?q=${searchTerm}`,
    );

    await Promise.all(
      apiCall1.data.data.map(async (entry) => {
        const subApiCall = await axios.get(
          `https://api.artic.edu/api/v1/artworks/${entry.id}?fields=id,title,image_id`,
        );

        const url = `${subApiCall.data.config.iiif_url}/${subApiCall.data.data.image_id}/full/843,/0/default.jpg`;
        //console.log(subApiCall.data.data.title);
        const artObj = {
          name: "",
          title: subApiCall.data.data.title,
          img: url,
          caption: "",
          date: "",
          containerTitle: "",
        };

        allArtic.push(artObj);
      }),
    );
  };

  // MET ART
  const metArt = async (searchTerm) => {
    console.log("met call");
    const call = await axios.get(
      `https://collectionapi.metmuseum.org/public/collection/v1/search?q=${searchTerm}`,
    );

    let ids = [];
    for (let i = 0; i < call.data.objectIDs.length; i++) {
      if (i > 5) {
        break;
      }
      console.log(call.data.objectIDs[i]);
      ids.push(call.data.objectIDs[i]);
    }

    await Promise.all(
      ids.map(async (id) => {
        const url = `https://collectionapi.metmuseum.org/public/collection/v1/objects/${id}`;
        const objCall = await axios.get(url);

        const artObj = {
          name: objCall.data.artistDisplayName || "",
          title: objCall.data.title,
          img: objCall.data.primaryImage,
        };
        metArtObjs.push(artObj);
      }),
    );
  };

  const harvard = () => {
    console.log("harvard");
    return axios.get(
      `https://api.harvardartmuseums.org/object?keyword=${searchTerm}&size=100&apikey=a27500b4-d744-4b0c-a9b5-cbf8989dc970`,
    );
  };

  const rijk = () => {
    console.log("rijk");
    return axios.get(
      `https://data.rijksmuseum.nl/search/collection?creator=${searchTerm}&type=painting`,
    );
  };

  const clev = () =>
    axios.get(
      `https://openaccess-api.clevelandart.org/api/artworks/?q=${searchTerm}&has_image&limit=50`,
    );

  console.log("CLEV", clev);
  //Promise.all([metArt(), harvard(), rijk(), clev(), articCall(searchTerm)])
  // Promise.all([harvard(), rijk(), clev(), articCall(searchTerm)])
  Promise.all([harvard(), metArt(searchTerm), articCall(searchTerm)])
  // Promise.all([clev()])
    .then((response) => {
      const harvard = response[0].data;
      //console.log(met)
      // format data()
      const harvardFormatted = harvardFormatter(harvard, searchTerm);
      //const rijkFormatted = rijkArtObject(rijk, searchTerm);

      allArt = [
        ...allArtic,
        ...metArtObjs,
        ...harvardFormatted,
        //...rijkFormatted,
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
