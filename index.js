var http = require('http');
var url = require('url');
var fs = require('fs');
const extract = require('extract-zip')
const dirTree = require('./node_modules/directory-tree');
const { dir } = require('console');

http.createServer(async function (req, res) {
    var query = url.parse(req.url, true).path
    if (query !== '/favicon.ico') {
        packId = query.substring(1)
        const tree = dirTree("E:/TelegramChannelProject").children
        let targetDir
        tree.forEach(treeDir => {
            if (treeDir.name.startsWith(packId)) {
                targetDir = treeDir
            }
        });

        console.log('Current Directory: ' + targetDir.name);
        // console.log(targetDir);

        let zipsToDelete = [];
        let osuFiles = [];
        let formatedSongInfos = [];

        await targetDir.children.forEach(dirFile => {
            if (dirFile.extension === '.osz') {

                originalPath = dirFile.path.substring(0, dirFile.path.length - 4);
                fs.copyFile(originalPath + '.osz', originalPath + '.zip', (err) => {
                    if (err) throw err;
                    console.log('Cloning')
                });
            }
        });

        await targetDir.children.forEach(dirFile => {
            if (dirFile.extension === '.zip') {

                originalPath = dirFile.path.substring(0, dirFile.path.length - 4);
                extractFrom(originalPath)
            }
        });

        await targetDir.children.forEach(async dirFile => {
            if (dirFile.type === 'directory') {
                // osuFiles.push(dirFile.children.find(osuFile => osuFile.extension === '.osu').path)
                console.log(dirFile)
            }
        });

        let myCounter = 0;

        await osuFiles.forEach(aSingleFile => {
            fs.readFile(aSingleFile, 'utf8', async function (err, data) {
                if (err)
                    throw err;
                let songInfoArray = data.substring(
                    data.lastIndexOf("[Metadata]") + 12,
                    data.lastIndexOf("[Difficulty]") - 3
                ).split('\n');

                console.log('SongInfo');

                let songInfo = {};
                myCounter++;
                songInfo.number = myCounter;

                songInfo.title = songInfoArray[0].substring(
                    songInfoArray[0].indexOf("Title:") + 6,
                    songInfoArray[0].length - 1
                )

                songInfo.artist = songInfoArray[2].substring(
                    songInfoArray[2].indexOf("Artist:") + 7,
                    songInfoArray[2].length - 1
                )

                songInfo.fullTitle = songInfo.title + ' - ' + songInfo.artist;

                songInfo.mapper = songInfoArray[4].substring(
                    songInfoArray[4].indexOf("Creator:") + 8,
                    songInfoArray[4].length - 1
                )

                songInfo.id = songInfoArray[9].substring(
                    songInfoArray[9].indexOf("BeatmapSetID:") + 13,
                    songInfoArray[9].length - 1
                )

                songInfo.link = 'https://osu.ppy.sh/beatmapsets/' + songInfo.id;
                formatedSongInfos.push(listItemBuilder(songInfo));
            });
        });



        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.write(JSON.stringify(formatedSongInfos))
        res.end();
    }
}).listen(9999);

async function extractFrom(originalPath) {
    try {
        await extract(originalPath + '.zip', { dir: originalPath })
        console.log('Extraction')
    } catch (err) {
        console.log('Failed to extract')
        console.log(err)
    }
}
// console.log(dirTree(originalPath))
// const unzipTree = dirTree(originalPath).children
// if (unzipTree.length === 0)
//     await extract(originalPath + '.zip', { dir: originalPath })


async function listItemBuilder(songInfo) {
    return songInfo.number + '. [' + songInfo.fullTitle + '](' + songInfo.link + ') by ' + songInfo.mapper;
}