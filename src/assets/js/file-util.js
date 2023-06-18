import { EMPTY_ANNOTATION, DOWNLOAD_FILE_NAME } from './constants.js';

export async function parseJsonFile(file) {
    return new Promise((resolve, reject) => {
        const fileReader = new FileReader()
        fileReader.onload = e => resolve(JSON.parse(e.target.result))
        fileReader.onerror = error => reject(error)
        fileReader.readAsText(file)
    })
}

export async function handle_file_upload(e) {
    let file = e.target.files[0];
    let new_data = await parseJsonFile(file);
    for (let i = 0; i < new_data.length; i++) {
        if (new_data[i].annotations == undefined) {
            new_data[i].annotations = EMPTY_ANNOTATION
        }
    }
    return new_data
}

export function handle_file_download(data) {
    var json = JSON.stringify(data);
    var url = URL.createObjectURL(new Blob([json], { type: "application/json" }));
    $("<a>").attr({ href: url, download: DOWNLOAD_FILE_NAME }).appendTo("body")[0].click();
    URL.revokeObjectURL(url);
}

export function get_file_path() {
    let urlParams = new URLSearchParams(window.location.search);
    let data_path = urlParams.get('data');
    if (data_path != null) {
        return data_path
    }
    return 'demo.json' // for testing - https://raw.githubusercontent.com/Yao-Dou/ts-annotation-tool/main/data/test_set_inspection_annotated/batch_1_ayush.json
}

export function download_data(file_path) {
    return fetch(file_path)
        .then(r => r.json())
        .then(json => {
            let hits_data = json;
            for (let i = 0; i < hits_data.length; i++) {
                if (hits_data[i].annotations == undefined) {
                    hits_data[i].annotations = EMPTY_ANNOTATION
                }
            }
            return hits_data;
        });
}