var http = require('http');
var url = require('url');
var fs = require('fs');
const extract = require('extract-zip')
const dirTree = require('directory-tree');

http.createServer(async function(req, res) {

    let query = url.parse(req.url, true).path.substring(1);
    if (query !== 'favicon.ico') {

        const start = dirTree("F:/TelegramChannelProject").children;

        // # rodar 3 vezes primeiro

        // asyncSendFinalResponse(
        //     asyncFilterSongInfo(
        //         asyncSelectSongInfo(
        //             asyncSelectOsu(
        //                 asyncSelectFolder(
        //                     asyncUnzipZips(
        //                         asyncSelectZip(
        //                             asyncGenerateZip(
        //                                 asyncSelectOsz(
        //                                     asyncSelectDir(
        //                                         start, query
        //                                     )
        //                                 ),
        //                                 asyncSelectDir(
        //                                     start, query
        //                                 )
        //                             )
        //                         ),
        //                         asyncSelectDir(
        //                             start, query
        //                         )
        //                     )
        //                 )
        //             )
        //         )
        //     ), res, asyncSelectDir(start, query)
        // );

        // # rodar 1 vez depos

        asyncSendFinalResponse(
            asyncFilterSongInfo(
                asyncSelectSongInfo(
                    asyncSelectOsu(
                        asyncSelectFolder(
                            asyncSelectDir(
                                start, query
                            )
                        )
                    )
                )
            ), res, asyncSelectDir(start, query)
        );

    }
}).listen(1111);

async function extractFrom(originalPath) {
    try {
        await extract(originalPath + '.zip', { dir: originalPath })
            // console.log('Extraction complete')
    } catch (err) {
        console.log('Failed to extract')
        console.log(err)
    }
}

const asyncSelectDir = async(list, query) => {
    var pack;

    // for (let child in list) {
    for (let i = 0; i < list.length; i++) {
        const child = list[i]

        if (child.name.startsWith(query)) {
            pack = child;
        }
    }

    // console.log(pack);
    return pack
}

const asyncSelectOsz = async(list) => {
    await list.then(x => {
        list = x.children;
    });
    const oszFiles = [];

    // for (const file in list) {
    for (let i = 0; i < list.length; i++) {
        const file = list[i]

        if (file.extension === '.osz') {
            oszFiles.push(file);
        }
    }

    // console.log(oszFiles);
    return oszFiles
}

const asyncGenerateZip = async(list, source) => {
    await list.then(x => {
        list = x;
    });

    // for (const map in list) {
    for (let i = 0; i < list.length; i++) {
        const map = list[i]

        const originalPath = map.path.substring(0, map.path.length - 4);
        fs.copyFile(originalPath + '.osz', originalPath + '.zip', (err) => {
            if (err) {
                console.log('Failed to copy file');
                console.log(err);
                throw err;
            }
        });
    }
    return source
}

const asyncSelectZip = async(list) => {
    await list.then(x => {
        list = x.children;
    });
    const zipFiles = [];

    // for (const file in list) {
    for (let i = 0; i < list.length; i++) {
        const file = list[i]
        if (file.extension === '.zip') {
            zipFiles.push(file);
        }
    }

    // console.log(zipFiles);
    return zipFiles
}

const asyncDeleteZip = async(list) => {

    // for (const file in list) {
    for (let i = 0; i < list.length; i++) {
        const file = list[i]
        if (file.extension === '.zip') {
            fs.unlink(file.path, (err) => {
                if (err) {
                    console.log('Failed to copy file');
                    console.log(err);
                    throw err;
                }
            });
        }
    }

    // console.log(zipFiles);
    return list;
}



const asyncUnzipZips = async(list, source) => {
    await list.then(x => {
        list = x;
    });
    // for (const zip in list) {
    for (let i = 0; i < list.length; i++) {
        const zip = list[i]
        const originalPath = zip.path.substring(0, zip.path.length - 4);
        extractFrom(originalPath);
    }

    return source
}

const asyncSelectFolder = async(list) => {
    await list.then(x => {
        list = x.children;
    });
    const folders = [];

    // for (const file in list) {
    for (let i = 0; i < list.length; i++) {
        const file = list[i]

        if (file.type === 'directory') {
            folders.push(file.children);
        }
    }

    // console.log(folders);
    return folders
}

const asyncSelectOsu = async(list) => {
    await list.then(x => {
        list = x;
    });
    const osuFiles = [];

    // for (const file in list) {
    for (let i = 0; i < list.length; i++) {
        const folder = list[i]

        for (let j = 0; j < folder.length; j++) {
            const file = folder[j]

            if (file.extension === '.osu') {
                osuFiles.push(file);
                break
            }
        }
    }

    // console.log(osuFiles);
    return osuFiles
}

const asyncSelectSongInfo = async(list) => {
    await list.then(x => {
        list = x;
    });
    const txtFiles = []

    // for (const osu in list) {
    for (let i = 0; i < list.length; i++) {
        const osu = list[i]
        const rawData = fs.readFileSync(osu.path, 'utf8')
        txtFiles.push(rawData);
    }

    // console.log(txtFiles);
    return txtFiles;
}

const asyncFilterSongInfo = async(list) => {
    await list.then(x => {
        list = x;
    });
    const infoFromFiles = []

    let itemCounter = 0;
    // for (const data in list) {
    for (let i = 0; i < list.length; i++) {
        const data = list[i]

        itemCounter++;
        let infoFromFile;
        await asyncSongInfoSearcher(data, itemCounter).then(x => {
            infoFromFile = x;
        });
        infoFromFiles.push(infoFromFile);
    }

    // console.log(infoFromFiles);
    return infoFromFiles
}

const asyncSongInfoSearcher = async(fileContent, number) => {
    const metadataArray = fileContent.substring(
        fileContent.lastIndexOf("[Metadata]") + 12,
        fileContent.lastIndexOf("[Difficulty]") - 3
    ).split('\n');
    console.log(metadataArray)

    let songInfo = {};

    songInfo.number = number;

    songInfo.title = metadataArray[0].substring(
        metadataArray[0].indexOf("Title:") + 6,
        metadataArray[0].length - 1
    )

    songInfo.artist = metadataArray[metadataArray.length > 6 ? 2 : 1].substring(
        metadataArray[metadataArray.length > 6 ? 2 : 1].indexOf("Artist:") + 7,
        metadataArray[metadataArray.length > 6 ? 2 : 1].length - 1
    )

    songInfo.fullTitle = songInfo.artist + ' - ' + songInfo.title;

    songInfo.mapper = metadataArray[metadataArray.length > 6 ? 4 : 2].substring(
        metadataArray[metadataArray.length > 6 ? 4 : 2].indexOf("Creator:") + 8,
        metadataArray[metadataArray.length > 6 ? 4 : 2].length - 1
    )

    songInfo.id = metadataArray.length > 6 ? metadataArray[9].substring(
        metadataArray[9].indexOf("BeatmapSetID:") + 13,
        metadataArray[9].length - 1
    ) : 0

    console.log(songInfo)
    songInfo.link = 'https://osu.ppy.sh/beatmapsets/' + songInfo.id;
    return songInfo;
}

const listItemBuilder = (songInfo) => {
    return songInfo.number + '. [' + songInfo.fullTitle + '](' + songInfo.link + ') by ' + songInfo.mapper;
}

const asyncSendFinalResponse = async(infos, res, source) => {
    await infos.then(x => {
        infos = x;
    });
    await source.then(x => {
        source = x;
    });

    let completeList = 'Beatmap Pack #' + source.name + '\nby Jacques VST\n\n'
    infos.forEach(info => {
        completeList += listItemBuilder(info) + '\n'
    });
    completeList += '\nDownload Below'

    fs.writeFile(source.path + '/MapLinks.txt', completeList, (err) => {
        if (err) {
            console.log('Failed to copy file');
            console.log(err);
            throw err;
        }
    });

    // asyncDeleteZip(source.children)

    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(completeList)
    res.end();
}