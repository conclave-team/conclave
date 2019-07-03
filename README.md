![Conclave Logo](/public/assets/img/conclave-mask-small.ico)

# Conclave: Collaborate in private

# No Longer Maintained

Conclave was made for fun and educational purposes but it is no longer actively maintained. The creators have since moved onto other projects and work. It will remain open so that developers can ask questions and fork it. The demo at [https://conclave.tech](https://conclave.tech) will also stay up. However, feature requests will **not** be worked on by the creators at this time.

Thanks again to all the developers who found this project interesting. Feel free ask questions to learn more about how it works and its internals. Hopefully you will venture off and create your own version of Conclave as well.

## Summary

Conclave is an open-source, real-time, collaborative text editor for the browser built from scratch in JavaScript.

Intrigued by collaboration tools like Google Docs, we set out to build one from scratch. Conclave uses **Conflict-Free Replicated Data Types** (CRDT) to make sure all users stay in-sync and **WebRTC** to allow users to send messages directly to one another. The result is a private and decentralized way to collaborate on documents.

For more details on how we designed and built Conclave, read our [case study](https://conclave-team.github.io/conclave-site/).

# How to Run Locally

You will need node and npm. First download the dependencies.

```
npm install
```

Next, you will need to build and compile the assets and start the server. You can do that all in an npm command.

```
npm run local
```

We've added a Makefile and Dockerfile to make this easier. I highly recommend using them.

Simply run:

```
make run-local
```

And you will be good to go.
