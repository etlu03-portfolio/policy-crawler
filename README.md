# App developer privacy policy scraper for the Google Play Store
This repository contains the source code of Google Play Store web crawler. This web crawler searches for the current developer's privacy policy and moves using tree-like traversal to other neighboring apps. When the web crawler finishes the scraping routine, a file called corpus.csv will contain all the found URLs to developer privacy policies.

# Setup
To use this service, you will need [Node.js](https://nodejs.org/en), which you should install beforehand. <br>
Then, clone this repository to your local machine by running the following command:
```shell
> git clone https://github.com/etlu03-portfolio/policy-spider.git
```
Now, install the module's dependencies by 'cd'-ing into the root of the repository and running one of the following commands:
```shell
> npm install
# or
> sh setup.sh
# to install development dependencies
```

# Usage
Once all dependencies have been installed, you can dispatch a web crawler by running the following command:
```shell
> node crawler.js {the URL of choice} {the depth of choice}

# examples
> node crawler.js "https://play.google.com/store/apps/details?id=com.chess&hl=en_US&gl=US" 2
> node crawler.js "https://play.google.com/store/apps/details?id=com.miniclip.eightballpool&hl=en_US&gl=US" 1
```

# Reference
| Screenshot of a Google Play Store app |
| ------------------------------------- |
| <img src="./docs/example.png"         |
