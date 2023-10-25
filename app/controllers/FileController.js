const { storage } = require('../../helpers/GCPConfig')
const bucket = storage.bucket(process.env.GCP_BUCKET)
async function uploadFile(file, access) {
    console.log("file ", file);
    file.name = file.name.replace(/\s/g, '');
    file.name = file.name.replace('#', '');
    file.name = file.name.replace('"', '');
    let fileName = file.name;
    const fileExtension = file.name.substring(file.name.lastIndexOf('.'));
    const fileNameWithoutExtension = "fileupload/" + Date.now() + "/" + file.name.substring(0, file.name.lastIndexOf('.'));
    console.log("fileNameWithoutExtension,fileExtension ", fileNameWithoutExtension, fileExtension)

    // const attempts = await getS3ObjectsCount(fileNameWithoutExtension, fileExtension)
    // console.log("attempts ", attempts)
    // if (attempts > 0) {
    //     fileName = `${fileNameWithoutExtension}(${attempts+1})${fileExtension}`;
    // }else{
    //     fileName= `${fileNameWithoutExtension}${fileExtension}`;
    // }
    fileName = `${fileNameWithoutExtension}${fileExtension}`;
    console.log("fileName ", fileName)
    if (access === "Public") {
        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
        };
        console.log("params ", params);
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
            ContentDisposition: 'inline',
            ContentType: file.mimetype,
            Body: file.data,
            ACL: "public-read",
        };
        const data = await s3.upload(uploadParams).promise();
        console.log("data ", data);
        return data;
    } else if (access === "Private") {
        const params = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
        };
        console.log("params ", params);
        const uploadParams = {
            Bucket: process.env.AWS_BUCKET,
            Key: `${fileName}`,
            ContentDisposition: 'inline',
            ContentType: file.mimetype,
            Body: file.data,
        };
        const data = await s3.upload(uploadParams).promise();
        console.log("data ", data);
        return data;
    }
}
exports.fileUploadS3 = async (req, res, next) => {
    try {
        console.log("req.files ", req.files)
        console.log("req.files.file ", req.files.file)
        console.log("req.files.file.mimetype ", req.files.file.mimetype)
        console.log("req.body ", req.body)
        let typeFile;
        if (req.files.file.mimetype.includes("audio")) {
            typeFile = "Audio"
        } else if (req.files.file.mimetype.includes("application") && !req.files.file.mimetype.includes("rar") && !req.files.file.mimetype.includes("zip") && !req.files.file.name.includes("rar") && !req.files.file.name.includes("zip")) {
            typeFile = "Document"
        } else if (req.files.file.mimetype.includes("image")) {
            typeFile = "Image"
        } else if (req.files.file.mimetype.includes("video")) {
            typeFile = "Video"
        }
        //console.log("process.env ", process.env)
        if (req.body.type === "Private") {
            const fileLocation = await uploadFile(req.files.file, "Private");
            console.log("fileLocation ", fileLocation)
            console.log("req.userId ", req.userId);
            var url = fileLocation.Location
            let urlNew = url.replace(process.env.S3_URL, process.env.CDN_URL);
            urlNew = urlNew.replace(process.env.S3_URL2, process.env.CDN_URL);
            var urlPath = urlNew.replace(process.env.CDN_URL, "");
            console.log("urlNew ", urlNew)
            return res.status(200).json({ fileLocation: fileLocation.Location, urlCDN: urlNew, urlPath: urlPath });
        } else if (req.body.type === "Public") {
            const fileLocation = await uploadFile(req.files.file, "Public");
            console.log("fileLocation ", fileLocation)
            console.log("req.userId ", req.userId)
            var url = fileLocation.Location
            let urlNew = url.replace(process.env.S3_URL, process.env.CDN_URL);
            urlNew = urlNew.replace(process.env.S3_URL2, process.env.CDN_URL);
            var urlPath = urlNew?.replace(process.env.CDN_URL, "");
            console.log("urlNew ", urlNew)
            console.log("urlPath ", urlPath)
            // returning fileupload location
            return res.status(200).json({ fileLocation: fileLocation.Location, urlCDN: urlNew, urlPath: urlPath });
        }
    } catch (error) {
        console.error('Error handling webhook:', error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
};
exports.fileUploadGCP = async (req, res, next) => {
    try {
        const { originalname, buffer } = file
        console.log("Orginal name_>", originalname, buffer)
        const blob = bucket.file(originalname.replace(/ /g, "_"))
        console.log("bolb", blob)
        const blobStream = blob.createWriteStream({
            resumable: false
        })
        const publicUrl = await blobStream.on('finish', () => {
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${blob.name}`
            resolve(publicUrl)
        })
            .on('error', (error) => {
                console.log("Error is ", error)
                reject(`Unable to upload image, something went wrong`)
            })
            .end(buffer)
            await res.status(200).json({
                success:true,
                message:"GCP file uploaded successfully",
                publicUrl
            })
    } catch (error) {
        console.error('Error handling webhook:', error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
};