# Focus Buddy

Project structure:

```text
focusbuddy_split/
├── index.html
├── css/
│   └── style.css
├── js/
│   └── app.js
├── audio/
├── images/
└── assets/
```

## Add a new built-in ambience

1. Put the audio file in `audio/`.
2. Put the matching background image in `images/`.
3. Open `js/app.js`.
4. Add one object to `ambientSounds`:

```js
{
  name: "Forest",
  audio: "audio/forest.mp3",
  image: "images/forest.jpg"
}
```

The app will automatically add it to the dropdown, include it in Random Ambient,
and switch to the matching image when that sound is selected.

## Existing assets

Move your current files into these folders:

### audio/
- Dryer.mp3
- rain.mp3
- White-Noise.mp3
- Ocean.mp3
- Heater.mp3
- india.mp3
- piano.mp3

### images/
- background.jpg
- Dryer.jfif
- rain.jfif
- White-Noise.jfif
- Ocean.jpg
- Heater.jfif
- india.jpg
- piano.jfif

### assets/
- ding.mp3
