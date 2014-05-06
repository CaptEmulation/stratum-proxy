Introduction
=============

Stratum-to-stratum proxy intended for connecting multiple miners to one or more pools.  The proxy tries to hide the authentication of one side from the other and passes through all traffic.  This turns out not to be enough to be able to submit shares-- but it is enough for clients to be issued work.

Background
============
Written to serve as a control point for a variety of hobbiest mining equipment, as an alternative to screen/web console based management of separate devices.  Works in so much that there is a pool stratum client (target.js) module, a miner stratum server (server.js) module and related socket glue and factory pieces.  The target side authenticates with the pool credentials and the server side authenticates (or rejects) mining clients.  

Future
============
Project currently on hold due to an attempt to utilize bfgminer stratum proxy feature to allieviate the need for this module.


