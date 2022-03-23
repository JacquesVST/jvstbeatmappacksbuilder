import http from 'http';
import fs from 'fs';
import dirTree, { DirectoryTree } from 'directory-tree';
import JSZip from "jszip";

const osujson = require('osu-json');

http.createServer(async function (req, res) {
    const initialDir = dirTree("F:/TelegramChannelProject").children;
    let responseMessage = '';

    const packNumber: string | undefined = req?.url?.substring(1);
    if (packNumber && !isNaN(parseInt(packNumber))) {
        const packDir = initialDir?.find(dir => dir.name.startsWith(packNumber));
        if (packDir) {
            responseMessage = `Generating pack #${packNumber} info...`;

            const oszFiles = getOszFiles(packDir);
            if (oszFiles) {
                const osuFilesJson = await Promise.all([...oszFiles.map(getOsuFile)]);
                const filteredInfo = osuFilesJson.map(filterBeatmapInfo).sort(sortMetadata);

                try {
                    responseMessage = formatInfo(filteredInfo, packDir.name)
                    fs.writeFile(packDir.path + '/MapLinks.txt', responseMessage, (err) => {
                        if (err) {
                            console.log('Failed to copy file');
                            console.log(err);
                            throw err;
                        }
                    });
                } catch (e) {
                    responseMessage = JSON.stringify(filteredInfo);
                    console.error(e);
                }

            } else {
                responseMessage = 'No maps to parse';
            }
        } else {
            responseMessage = 'Inexistent pack number';
        }
    } else {
        responseMessage = 'Invalid pack number';
    }
    res.writeHead(200, { 'Content-Type': 'text/html' });
    res.write(responseMessage)
    res.end();
}).listen(80);

function getOszFiles(dir: DirectoryTree) {
    return dir?.children?.filter(file => file?.name.endsWith('osz'));
}

async function getOsuFile(osz: DirectoryTree) {
    const zip = await Promise.resolve(JSZip.loadAsync(fs.readFileSync(osz.path)));
    for (const item in zip.files) {
        if (item.endsWith('osu')) {
            const osuFile = await (zip.files[item].async('string'));
            let osuFileContent: any;
            try {
                osuFileContent = await osujson.ParseOSUFileAsync(osuFile).catch(console.error);
            } catch (error) {
                console.log('Using legacy parser for ' + item);
                osuFileContent = legacyParseOSU(osuFile);
            }
            return osuFileContent;
        }
    }
}

function filterBeatmapInfo(beatmapJson: { [x: string]: any; }) {
    return beatmapJson['Metadata'];
}

function sortMetadata(a: any, b: any) {
    const prop = 'BeatmapSetID'
    return a[prop] - b[prop];
}

function legacyParseOSU(file: any){
    return { 'Metadata': {}};
}

function formatInfo(metdata: any[], packName: string){
    let finalTxt = `Beatmap Pack #${packName}\n`;
    finalTxt += 'By Jacques VST\n\n';

    metdata.forEach(data => {
        finalTxt += `[${data.Artist} - ${data.Title}](https://osu.ppy.sh/beatmapsets/${data.BeatmapID}) by ${data.Creator}\n`;
    });

    finalTxt += '\nDownload Below';

    return finalTxt;
}
