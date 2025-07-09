const axios = require('axios');
const cheerio = require('cheerio');

class MaratonaAppWrapper {
    constructor(baseUrl = "https://maratona.app") {
        this.baseUrl = baseUrl;
    }

    async getUser(username) {
        try {
            const response = await axios.get(`${this.baseUrl}/@${username}`);
            const $ = cheerio.load(response.data);
            const avatarUrl = $('img.avatar').attr('src');
            const pronouns = $('span[data-slot="badge"]').map(function () {
                return $(this).text().trim();
            }).get().join('/').trim();

            const userNotFound = $('h1').text().includes('Usuário foi renomeado ou ainda não vinculou sua conta no site.');
            if (userNotFound) {
                throw new Error(`User '${username}' not found.`);
            }

            return {
                username: username,
                url: `${this.baseUrl}/@${username}`,
                avatar: avatarUrl || null,
                pronouns: pronouns || null
            };
        } catch (error) {
            throw new Error(`Error fetching user: ${error.message}`);
        }
    }

    async getCurrentReading(username) {
        try {
            const response = await axios.get(`${this.baseUrl}/@${username}`);
            const $ = cheerio.load(response.data);

            const userNotFound = $('h1').text().includes('Usuário foi renomeado ou ainda não vinculou sua conta no site.');

            if (userNotFound) {
                throw new Error(`Usuário '${username}' não encontrado.`);
            }

            const readingSpan = $('span').filter(function () {
                return $(this).text().includes('lendo:');
            }).first();

            if (!readingSpan) {
                throw new Error(`Usuário '${username}' não está lendo nada no momento. Por favor, verifique se a estante do livro da leitura atual é pública.`);
            }

            const readingDiv = readingSpan.parent().children('div').first();

            const bookTitle = readingDiv.find('span.line-clamp-1').text().trim();
            const readPercentage = parseInt(readingDiv.find('span.shrink-0 span').text().trim());

            let bookCover = null;
            
            const pageContent = response.data;
            
            const cdnMatches = pageContent.match(/https:\/\/cdn\.maratona\.app\/[^"'\s]+\.jpeg[^"'\s]*/g);
            if (cdnMatches && cdnMatches.length > 0) {
                bookCover = cdnMatches[0];
            }
            
            if (!bookCover) {
                const s3Matches = pageContent.match(/https:\/\/edicoes\.s3\.sa-east-1\.amazonaws\.com\/[^"'\s]+\.jpeg/g);
                if (s3Matches && s3Matches.length > 0) {
                    bookCover = s3Matches[0];
                }
            }
            
            if (!bookCover) {
                const capaMatch = pageContent.match(/"capa":"([^"]+)"/);
                if (capaMatch && capaMatch[1]) {
                    bookCover = capaMatch[1];
                }
            }

            return {
                title: bookTitle,
                percentage: readPercentage,
                cover: bookCover || null,
            };
        } catch (error) {
            throw new Error(`Error fetching current reading: ${error.message}`);
        }
    }
}

const maratonaAppWrapper = new MaratonaAppWrapper();

module.exports = maratonaAppWrapper;
module.exports.MaratonaAppWrapper = MaratonaAppWrapper;
module.exports.default = maratonaAppWrapper;