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
            let bookAuthor = null;
            
            const pageContent = response.data;
            
            const autorMatch = pageContent.match(/"autor":"([^"]+)"/);
            if (autorMatch && autorMatch[1]) {
                bookAuthor = autorMatch[1];
            }
            
            if (!bookAuthor) {
                const authorsMatch = pageContent.match(/"autores":\[([^\]]+)\]/);
                if (authorsMatch && authorsMatch[1]) {
                    try {
                        const authorsArray = JSON.parse(`[${authorsMatch[1]}]`);
                        if (authorsArray.length > 0) {
                            bookAuthor = authorsArray.join(', ');
                        }
                    } catch (e) {
                        const simpleAuthor = authorsMatch[1].replace(/"/g, '').trim();
                        if (simpleAuthor) {
                            bookAuthor = simpleAuthor;
                        }
                    }
                }
            }
            
            if (!bookAuthor) {
                const bookJsonMatch = pageContent.match(/{[^}]*"titulo"[^}]*"autor":"([^"]+)"[^}]*}/);
                if (bookJsonMatch && bookJsonMatch[1]) {
                    bookAuthor = bookJsonMatch[1];
                }
            }
            
            if (!bookAuthor) {
                const bookJsonAuthorsMatch = pageContent.match(/{[^}]*"titulo"[^}]*"autores":\[([^\]]+)\][^}]*}/);
                if (bookJsonAuthorsMatch && bookJsonAuthorsMatch[1]) {
                    try {
                        const authorsArray = JSON.parse(`[${bookJsonAuthorsMatch[1]}]`);
                        if (authorsArray.length > 0) {
                            bookAuthor = authorsArray.join(', ');
                        }
                    } catch (e) {
                        const simpleAuthor = bookJsonAuthorsMatch[1].replace(/"/g, '').trim();
                        if (simpleAuthor) {
                            bookAuthor = simpleAuthor;
                        }
                    }
                }
            }
            
            if (!bookAuthor) {
                const authorPattern = pageContent.match(/(?:de|por|by)\s+([A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ][A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ\s\.\-]{2,49})/i);
                if (authorPattern && authorPattern[1]) {
                    const candidateAuthor = authorPattern[1].trim();
                    const invalidWords = ['aqui', 'lendo', 'atual', 'agora', 'hoje', 'reading', 'página', 'link'];
                    const isValid = !invalidWords.some(word => 
                        candidateAuthor.toLowerCase().includes(word.toLowerCase())
                    );
                    if (isValid) {
                        bookAuthor = candidateAuthor;
                    }
                }
            }
            
            if (!bookAuthor) {
                // Buscar por "autor: Nome" ou "Author: Nome"
                const authorColonPattern = pageContent.match(/(?:autor|author):\s*([A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ][A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ\s\.\-]{2,49})/i);
                if (authorColonPattern && authorColonPattern[1]) {
                    bookAuthor = authorColonPattern[1].trim();
                }
            }
            
            if (!bookAuthor) {
                const titleEscaped = bookTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const authorAfterTitlePattern = new RegExp(`${titleEscaped}[^"]*"([A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ][A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ\\s\\.\\-]{2,49})"`, 'i');
                const authorAfterTitleMatch = pageContent.match(authorAfterTitlePattern);
                if (authorAfterTitleMatch && authorAfterTitleMatch[1]) {
                    bookAuthor = authorAfterTitleMatch[1].trim();
                }
            }
            
            if (!bookAuthor) {
                const parentDiv = readingDiv.parent();
                const allSpans = parentDiv.find('span');
                allSpans.each(function() {
                    const text = $(this).text().trim();
                    const invalidTexts = ['aqui', 'lendo:', '%', 'reading', 'atual', 'agora', 'hoje', 'página'];
                    const isInvalid = invalidTexts.some(invalid => text.toLowerCase().includes(invalid.toLowerCase()));
                    
                    if (text && text !== bookTitle && !isInvalid && text.length > 2 && text.length < 100) {
                        if (/^[A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ][A-Za-záàâãéèêíîóôõúçÁÀÂÃÉÈÊÍÎÓÔÕÚÇ\s\.\-]{2,}$/.test(text)) {
                            bookAuthor = text;
                            return false;
                        }
                    }
                });
            }
            
            if (!bookAuthor) {
                const authorNames = [
                    'Carla Madeira', 'Carlos Drummond de Andrade', 'Machado de Assis', 
                    'Clarice Lispector', 'José Saramago', 'Paulo Coelho', 'Rubem Fonseca',
                    'Fernando Pessoa', 'Lygia Fagundes Telles', 'Graciliano Ramos'
                ];
                
                for (const authorName of authorNames) {
                    if (pageContent.includes(authorName)) {
                        const authorIndex = pageContent.indexOf(authorName);
                        const titleIndex = pageContent.indexOf(bookTitle);
                        
                        if (Math.abs(authorIndex - titleIndex) < 1000) {
                            bookAuthor = authorName;
                            break;
                        }
                    }
                }
            }
            
            if (!bookAuthor) {
                const namePattern = /([A-Z][a-záàâãéèêíîóôõúç]+\s+[A-Z][a-záàâãéèêíîóôõúç]+(?:\s+[A-Z][a-záàâãéèêíîóôõúç]+)?)/g;
                const nameMatches = [...pageContent.matchAll(namePattern)];
                
                for (const match of nameMatches) {
                    const candidateName = match[1].trim();
                    const nameIndex = pageContent.indexOf(candidateName);
                    const titleIndex = pageContent.indexOf(bookTitle);
                    
                    const invalidWords = ['Reading', 'Current', 'Status', 'Profile', 'Usuario', 'Maratona'];
                    const isInvalid = invalidWords.some(word => candidateName.includes(word));
                    
                    if (!isInvalid && Math.abs(nameIndex - titleIndex) < 1000) {
                        bookAuthor = candidateName;
                        break;
                    }
                }
            }
            
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
                author: bookAuthor || null,
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