## Installation

yarn add @ionic/cli
npx ionic start
yarn add @capacitor/android
npx cap add android
yarn build
npx cap sync android
<!-- npm init @capacitor/app@latest
yarn install
yarn add @capacitor/android
npx cap add android
npx cap sync android -->


## Build
In VScode run `yarn build && npx cap sync android`
Android studio open the `android` folder,
In android studio added `-Xlint:unchecked` in Settings> Build, Execution, Deployment > Gradle-Android Compiler > Command-line Options
Compile final app in build > Generate apk bundles etc.

