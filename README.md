## FFXIV Cactpot Solver

This repository contains a simple, straightforward optimization algorithm
for solving the Mini Cactpot game in Final Fantasy XIV.

As brute-forcing expected value for a 3-by-3 grid is not exactly a difficult
problem, this is implemented entirely in JavaScript and deployed as an
entirely "static" website.


### For Normal People

If you just want to optimize your daily Mini Cactpot ticket, you do not
need to do anything with this repository. Just use the [actual site][1].

You only need to be looking here if you want to _work on_ the code.

  [1]: http://www.ffxivcactpot.com/


### Running this Thing

This application can be deployed to an Ubuntu server using [Ansible][2]:

    ansible-playbook -i INVENTORY_FILE -v provisioning/playbook.yml

Note that you will need to create an Ubuntu server as well as an
inventory file.

For development work, use of [Vagrant][3] is recommended, and a `Vagrantfile`
is included.

  [2]: http://www.ansible.com/
  [3]: https://www.vagrantup.com/
