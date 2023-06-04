const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const PORT = 8000;
const url = "https://ecoshine.sklep.pl/";

axios(url).then((res) => {
  const html = res.data;
  const $ = cheerio.load(html);
  const elementWithTitle = $('a[title="CHEMIA OBIEKTOWA"]');
  let link = elementWithTitle.attr("href");
  link = link.substring(1);
  axios(url + link).then((res) => {
    const linkedHTML = res.data;
    const linked$ = cheerio.load(linkedHTML);
    const specificElement = linked$(
      '.productname:contains("ACTIVE CLEAN 10L - Koncentrat aktywnego preparatu silnie myjącego")'
    );
    if (specificElement.lenght > 0) {
      const parent = specificElement.parent().parent();
      const elementWithPrice = parent.find(".price.f-row");
      const emWithPrice = elementWithPrice.find("em");
      const price = emWithPrice.text();
      console.log(price);
    } else {
      console.log("there is no that product");
      // const ulElement = linked$("ul");
      // const paginator = ulElement.find(".paginator").eq(1);
      // console.log(paginator);
    }
  });
});
