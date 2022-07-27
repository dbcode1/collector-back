const axios = require("axios");
const {
  harvardFormatter,
  rijkArtObject,
  clevelandArtObject,
  metArtObjects,
  artsyArtObject,
} = require("../helpers/artObject");

const _ = require("lodash");

const rateLimit = require("axios-rate-limit");
const http = rateLimit(axios.create(), {
  maxRequests: 30,
  perMilliseconds: 1000,
  maxRPS: 60,
});
http.getMaxRPS(); // 2
const getImages = require("../helpers/wiki");

exports.search = async (req, res) => {
  const searchTerm = req.query.q;
  let harvardData;
  let rijkData;
  const allArt = [];


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

  Promise.all([harvard(), rijk(), clev()])
    .then((resp) => {
      const harvard = resp[0].data;
      const rijk = resp[1].data;
      const clev = resp[2].data;

      // format data
      const harvardFormatted = harvardFormatter(harvard, searchTerm);

      const rijkFormatted = rijkArtObject(rijk, searchTerm);

      const clevFormatted = clevelandArtObject(clev, searchTerm);

      // combine all data // concat
      const allArt = [...harvardFormatted, ...rijkFormatted, ...clevFormatted];

      if (allArt.length < 2) {
        res.status(400).send({ message: "No Results" });
      } else {
        res.status(200).json(allArt);
      }
    })
    .catch((err) => {
      res.status(400).json({ message: err.message });
    });
};
