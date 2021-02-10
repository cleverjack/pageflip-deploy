const Pdf = require('../models/pdf')
const Audio = require('../models/audio')
const Video = require('../models/video')
const fs = require('fs');

const pdfController = {
    index: async (req, res) => {
        try {
            const pdfs = await Pdf.find({});

            res.status(201).json(pdfs)
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    },
    getPublishedPdfs: async (req, res) => {
        try {
            const pdfs = await Pdf.find({published: true});
            
            for (let i = 0; i < pdfs.length; i++) {
                pdfs[i].bgAudio = await Audio.findOne({pdfId: pdfs[i]._id, type: 0});
                pdfs[i].pageAudios = await Audio.find({pdfId: pdfs[i]._id, type: 1});
            }
            res.status(201).json(pdfs)
        } catch (err) {
            res.status(400).json({ message: err.message })
        }
    },
    upload: async (req, res) => {
        try {
            if (req.file) {
                let pdf = await Pdf.findById(req.body._id);
                if (!pdf) {
                    pdf = new Pdf();
                } else {
                    let filePath = './uploads/' + pdf.url;
                    try {
                        if (fs.existsSync(filePath))
                            fs.unlinkSync(filePath);
                    } catch (e) {
                        console.log(e);
                    }
                }
    
                pdf.name = req.file.originalname;
                pdf.url = req.file.filename;
                pdf.size = req.file.size;
                pdf.mimetype = req.file.mimetype;
    
                await pdf.save();
    
                res.status(201).json(pdf);
            }
            res.status(400).json({message: "upload failed"});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    getPdf: async (req, res) => {
        try {
            let id = req.params.id;

            if (!id) {
                return res.status(400).json({message: "missing id"});
            }
            let pdf = await Pdf.findById(id);
            res.status(201).json(pdf);
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    publishPdf: async (req, res) => {
        try {
            let id = req.params.id;

            if (!id) {
                return res.status(400).json({message: "missing id"});
            }
            let pdf = await Pdf.findById(id);
            pdf.published = req.body.published;
            console.log(req.body.published);
            await pdf.save();

            res.status(201).json(pdf);
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    getPdfAudios: async (req, res) => {
        try {
            let id = req.params.id;

            let bgAudio = await Audio.findOne({pdfId: id, type: 0});
            let pageAudios = await Audio.find({pdfId: id, type: 1});

            res.status(201).json({bgAudio: bgAudio, pageAudios: pageAudios});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    getAudio: async (req, res) => {
        try {
            let audio = await Audio.findOne({});

            res.status(201).json(audio);
        } catch (e) {
            res.status(400).json({ message: err.message })
        }
    },

    uploadAudio: async (req, res) => {
        try {
            if (req.file && req.body.pdfId) {
                let condition = {
                    pdfId: req.body.pdfId,
                    type: req.body.type
                };

                if (req.body.type == 1) {
                    condition.pageNum = req.body.pageNum;
                }

                let audio = await Audio.findOne(condition);

                if (!audio) {
                    audio = new Audio();
                } else {
                    let filePath = './uploads/audio/' + audio.url;
                    try {
                        if (fs.existsSync(filePath))
                            fs.unlinkSync(filePath);
                    } catch (e) {
                        console.log(e);
                    }
                }
    
                audio.name = req.file.originalname;
                audio.url = req.file.filename;
                audio.size = req.file.size;
                audio.mimetype = req.file.mimetype;
                audio.pdfId = req.body.pdfId;
                audio.type = req.body.type;
                if (req.body.type == 1) {
                    audio.pageNum = req.body.pageNum;
                }
    
                await audio.save();

                let pdf = await Pdf.findById(req.body.pdfId);
                if (req.body.type == 0) {
                    pdf.bgAudio = audio._id;
                } else {
                    pdf.pageAudios.push(audio._id);
                }
                await pdf.save();
    
                res.status(201).json(audio);
            }
            res.status(400).json({message: "upload failed"});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    getVideos: async (req, res) => {
        try {
            let videos = await Video.find({});

            return res.status(201).json(videos);
        } catch (e) {
            return res.status(500).json({ message: e.message });
        }
    },

    uploadVideo: async (req, res) => {
        try {
            if (req.file) {
                let video = new Video();
    
                video.name = req.file.originalname;
                video.url = req.file.filename;
                video.size = req.file.size;
                video.mimetype = req.file.mimetype;
    
                await video.save();
    
                res.status(201).json(video);
            }
            res.status(400).json({message: "upload failed"});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    deletePdf: async (req, res) => {
        try {
            let id = req.params.id;

            let pdf = await Pdf.findById(id);
            if (pdf == null) {
                return res.status(404).json({ message: 'Cant find pdf'})
            }
            
            let filePath = './uploads/' + pdf.url;
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);

            if (pdf.bgAudio) {
                let bgaudio = await Audio.findById(pdf.bgAudio);
                filePath = './uploads/audio/' + bgaudio.url;
                if (fs.existsSync(filePath))
                    fs.unlinkSync(filePath);
                await bgaudio.remove();
            }

            if (pdf.pageAudios.length) {
                for (let i=0; i<pdf.pageAudios.length; i++) {
                    let pageaudio = await Audio.findById(pdf.pageAudios[i]);
                    filePath = './uploads/audio/' + pageaudio.url;
                    if (fs.existsSync(filePath))
                        fs.unlinkSync(filePath);
                    await pageaudio.remove();
                }
            }

            pdf.remove();

            res.status(201).json({message: "successfully removed"});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    deleteVideo: async (req, res) => {
        try {
            let id = req.params.id;

            let video = await Video.findById(id);
            if (video == null) {
                return res.status(404).json({ message: 'Cant find video'})
            }
            
            let filePath = './uploads/videos/' + video.url; 
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);

            video.remove();

            res.status(201).json({message: "successfully removed"});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    },

    deleteAudio: async (req, res) => {
        try {
            let id = req.params.id;

            let audio = await Audio.findById(id);
            if (audio == null) {
                return res.status(404).json({ message: 'Cant find audio'})
            }
            
            let filePath = './uploads/audio/' + audio.url; 
            if (fs.existsSync(filePath))
                fs.unlinkSync(filePath);

            audio.remove();

            res.status(201).json({message: "successfully removed"});
        } catch (e) {
            return res.status(500).json({ message: e.message })
        }
    }
}

module.exports = pdfController;