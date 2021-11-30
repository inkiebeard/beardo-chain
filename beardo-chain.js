/**
 * Super rudimentary block chain implementation
 * @author Aaron Toomey <aaron@inkiebeard.codes>
 * @requires uuidv4
 * @requires sha256
 * todo: verify chain(s), calculate "value" factor for block, allow weighting and external operators for value calc
 */

class Block {
  constructor(data, parent) {
    this._id = uuidv4()
    this._data = data
    this._timestamp = new Date().getTime()
    this._parentId = parent.id
    this._parentHash = parent.hash
    this._generateHash()
  }

  _generateHash() {
    const { _hash, ...hashable} = this.map
    this._hash = sha256(JSON.stringify(hashable))
  }

  get data() {
    return this._data
  }

  get id() {
    return this._id
  }

  get hash() {
    return this._hash
  }

  get timestamp() {
    return this._timestamp
  }

  get parentId() {
    return this._parentId
  }

  get map () {
    return {
      id: this._id,
      data: this._data,
      timestamp: this._timestamp,
      parentId: this._parentId,
      parentHash: this._parentHash,
      hash: this._hash
    }
  }

  toJSON() {
    return JSON.stringify(this.map)
  }

  static fromJSON(json) {
    try {
      const tmp = JSON.parse(json)
      const {
        id,
        data,
        timestamp,
        parentId,
        parentHash,
        hash
      } = tmp
      // yuck not sure how to do this better ಠ_ಠ
      const block = new Block('to override', {id:'foo', hash:'bar'})
      block._id = id
      block._data = data
      block._timestamp = timestamp
      block._parentId = parentId
      block._parentHash = parentHash
      block._hash = hash
      return block
    } catch (e) {
      console.error(e.message)
      throw new Error('Invalid json string')
    }
  }
}

class Ledger {
  constructor() {
    this.blocks = {}
    this.list = []
    const genesis = new Block({owner: 'beardo'}, {id: null, hash: null})
    this.blocks[genesis.id] = genesis
    this.list.push(genesis.id)
    document.dispatchEvent(new Event('blockAdded'))
  }

  getLatestBlock() {
    return this.blocks[this.list[this.list.length-1]]
  }

  addBlock(data, parent = null) {
    parent = parent || this.getLatestBlock()
    const block = new Block(data, parent)
    this.blocks[block.id] = block
    this.fixListChrono()
    document.dispatchEvent(new Event('blockAdded'))
  }

  getBlockById(id) {
    return id && this.blocks.hasOwnProperty(id) ? this.blocks[id] : null
  }

  getChild(block) {
    return Object.values(this.blocks).find(b => b.parentId === block.id)
  }

  fixListChrono() {
    this.list = Object.values(this.blocks).sort((a,b) => a.timestamp - b.timestamp).map(b => b.id)
  }

  getBlockBranch(block) {
    let ancestors = []
    let descendents = []
    // look through parent tree in ledger
    let parent = this.getBlockById(block.parentId)
    do {
      if (parent) {
        ancestors = [parent, ...ancestors]
        parent = this.getBlockById(parent.parentId)
      }
    } while (parent !== null)

    // get all descendents
    let child = this.getChild(block)
    do {
      if (child) {
        descendents.push(child)
        child = this.getChild(child)
      }
    } while (child !== null)

    return { branch: [...ancestors, block, ...descendents], ancestors: ancestors.length, descendents: descendents.length }
  }

  toJSON () {
    let blockMaps = Object.values(this.blocks).map(block => block.map)
    return JSON.stringify(blockMaps)
  }

  static fromJSON(json) {
    try {
      const tmp = JSON.parse(json)
      if (!Array.isArray(tmp)) {
        throw new Error('Invalid array of blocks')
      }
      const ledger = new BeardoLedger()
      tmp.forEach(item => {
        ledger.blocks[item.id] = item
      })
      ledger.fixListChrono()
      return ledger
    } catch (e) {
      console.error(e.message)
      throw new Error(`Invalid json string: ${e.message}`)
    }
  }
}